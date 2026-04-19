import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TenantRole, TenantUser } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { StatusBadge } from "../components/ui/status-badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  TenantRouteFailureCard,
  formatRole,
  roleOptions,
  useTenantShellContext
} from "./tenant-shell";

type TenantUserFieldErrors = Partial<
  Record<"tenantUserEmail" | "tenantUserPassword" | "tenantUserRole", string>
>;

export function UsersPage() {
  const { apiClient, impersonation, startImpersonation } = useTenantShellContext();
  const navigate = useNavigate();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);
  const [tenantUserEmail, setTenantUserEmail] = useState("");
  const [tenantUserPassword, setTenantUserPassword] = useState("");
  const [tenantUserRole, setTenantUserRole] = useState<TenantRole>("BinderRead");
  const [fieldErrors, setFieldErrors] = useState<TenantUserFieldErrors>({});
  const [createError, setCreateError] = useState<TenantHostErrorViewModel | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TenantRole>>({});
  const [roleUpdateError, setRoleUpdateError] = useState<TenantHostErrorViewModel | null>(null);
  const [isRoleUpdatingForUserId, setIsRoleUpdatingForUserId] = useState<string | null>(null);
  const [impersonationError, setImpersonationError] = useState<TenantHostErrorViewModel | null>(null);
  const [isStartingImpersonationForUserId, setIsStartingImpersonationForUserId] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadUsers() {
      setIsLoading(true);

      try {
        const nextUsers = await apiClient.listTenantUsers(abortController.signal);
        if (abortController.signal.aborted) {
          return;
        }

        setUsers(nextUsers);
        setRoleDrafts(Object.fromEntries(nextUsers.map((user) => [user.userId, user.role])));
        setPageError(null);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageError(mapTenantHostError(error));
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      abortController.abort();
    };
  }, [apiClient, impersonation.effective.userId]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: TenantUserFieldErrors = {};
    if (!tenantUserEmail.trim()) {
      nextFieldErrors.tenantUserEmail = "Email is required.";
    }

    if (!tenantUserPassword.trim()) {
      nextFieldErrors.tenantUserPassword = "Password is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setCreateError(null);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    setFieldErrors({});

    try {
      const createdUser = await apiClient.createTenantUser({
        email: tenantUserEmail.trim(),
        password: tenantUserPassword,
        role: tenantUserRole
      });

      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [createdUser.userId]: createdUser.role
      }));
      setCreateSuccess(createdUser.email);
      setTenantUserEmail("");
      setTenantUserPassword("");
      setTenantUserRole("BinderRead");
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setCreateError(mappedError);
      setFieldErrors(
        mappedError.field === "tenantUserEmail"
          ? { tenantUserEmail: mappedError.detail }
          : mappedError.field === "tenantUserPassword"
            ? { tenantUserPassword: mappedError.detail }
            : mappedError.field === "tenantUserRole"
              ? { tenantUserRole: mappedError.detail }
              : {}
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(userId: string) {
    const nextRole = roleDrafts[userId];
    if (!nextRole) {
      return;
    }

    setRoleUpdateError(null);
    setIsRoleUpdatingForUserId(userId);

    try {
      const updatedUser = await apiClient.updateTenantUserRole(userId, {
        role: nextRole
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.userId === updatedUser.userId ? updatedUser : user))
      );
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [updatedUser.userId]: updatedUser.role
      }));
    } catch (error) {
      setRoleUpdateError(mapTenantHostError(error));
    } finally {
      setIsRoleUpdatingForUserId(null);
    }
  }

  async function handleStartImpersonation(userId: string) {
    setImpersonationError(null);
    setIsStartingImpersonationForUserId(userId);

    try {
      await startImpersonation(userId);
      navigate("/app");
    } catch (error) {
      setImpersonationError(mapTenantHostError(error));
    } finally {
      setIsStartingImpersonationForUserId(null);
    }
  }

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  const columns: readonly DataTableColumn[] = [
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "ownership", header: "Ownership" },
    { key: "actions", header: "Actions" },
    { key: "impersonation", header: "View as" }
  ];
  const rows: DataTableRow[] = users.map((user) => ({
    key: user.userId,
    cells: [
      <div key={`${user.userId}-email`}>
        <p className="font-medium text-[var(--pb-color-text)]">{user.email}</p>
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--pb-color-text-subtle)]">
          {user.userId}
        </p>
      </div>,
      <select
        aria-label={`Role for ${user.email}`}
        disabled={isRoleUpdatingForUserId === user.userId}
        key={`${user.userId}-role`}
        onChange={(event) => {
          setRoleDrafts((currentDrafts) => ({
            ...currentDrafts,
            [user.userId]: event.target.value as TenantRole
          }));
          setRoleUpdateError(null);
        }}
        value={roleDrafts[user.userId] ?? user.role}
      >
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {formatRole(role)}
          </option>
        ))}
      </select>,
      user.isOwner ? <StatusBadge key={`${user.userId}-owner`}>Owner</StatusBadge> : "Member",
      <Button
        isLoading={isRoleUpdatingForUserId === user.userId}
        key={`${user.userId}-action`}
        onClick={() => void handleRoleChange(user.userId)}
        type="button"
        variant="secondary"
      >
        Save role
      </Button>,
      impersonation.isImpersonating || user.userId === impersonation.effective.userId ? (
        <span
          className="text-sm text-[var(--pb-color-text-muted)]"
          key={`${user.userId}-impersonation-disabled`}
        >
          Not eligible
        </span>
      ) : (
        <Button
          isLoading={isStartingImpersonationForUserId === user.userId}
          key={`${user.userId}-impersonation`}
          onClick={() => void handleStartImpersonation(user.userId)}
          type="button"
          variant="secondary"
        >
          View as
        </Button>
      )
    ]
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant users</CardTitle>
          <CardDescription>
            Tenant-admin user management stays on this route and submits only the existing user and role contracts.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create tenant user</CardTitle>
            <CardDescription>
              Provide the email, initial password, and role. The browser does not add delete or reset flows in CP14.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <Field
                error={fieldErrors.tenantUserEmail}
                hint="Email is the canonical v1 identity label."
                label="Email"
              >
                <input
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserEmail(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserEmail: undefined
                    }));
                    setCreateError(null);
                  }}
                  placeholder="member@tenant.local"
                  type="email"
                  value={tenantUserEmail}
                />
              </Field>
              <Field
                error={fieldErrors.tenantUserPassword}
                hint="Password validation remains server-authoritative."
                label="Temporary password"
              >
                <input
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserPassword(event.target.value);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserPassword: undefined
                    }));
                    setCreateError(null);
                  }}
                  placeholder="Generated-on-request"
                  type="password"
                  value={tenantUserPassword}
                />
              </Field>
              <Field
                error={fieldErrors.tenantUserRole}
                hint="Each tenant member has one role in v1."
                label="Role"
              >
                <select
                  disabled={isCreating}
                  onChange={(event) => {
                    setTenantUserRole(event.target.value as TenantRole);
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      tenantUserRole: undefined
                    }));
                    setCreateError(null);
                  }}
                  value={tenantUserRole}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </Field>
              <TenantHostErrorNotice error={createError} />
              {createSuccess ? (
                <Alert variant="success">
                  <AlertTitle>Tenant user created.</AlertTitle>
                  <AlertBody>{createSuccess} was added to this tenant.</AlertBody>
                </Alert>
              ) : null}
              <Button isLoading={isCreating} type="submit">
                Create tenant user
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current tenant users</CardTitle>
            <CardDescription>
              Role changes remain subject to the server-side last-admin guard, and view-as start only exposes a safe
              eligible or not-eligible affordance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TenantHostErrorNotice error={roleUpdateError} />
            <TenantHostErrorNotice error={impersonationError} />
            <DataTable
              caption="Tenant users"
              columns={columns}
              emptyMessage="No tenant users are available."
              isLoading={isLoading}
              loadingLabel="Loading tenant users..."
              rows={rows}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
