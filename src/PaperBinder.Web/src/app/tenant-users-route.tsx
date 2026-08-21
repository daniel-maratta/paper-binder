import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TenantRole, TenantUser } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { StatusBadge } from "../components/ui/status-badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "../components/ui/table";
import { CredentialDisplayField } from "./credential-display-field";
import { CopyValueChip, writeClipboardValue } from "./copy-value-chip";
import type { TenantHostErrorViewModel } from "./tenant-host-errors";
import { mapTenantHostError } from "./tenant-host-errors";
import {
  TenantHostErrorNotice,
  TenantRouteFailureCard,
  formatRole,
  roleOptions,
  useIsDesktopShell,
  useTenantShellContext
} from "./tenant-shell";

type TenantUserFieldErrors = Partial<
  Record<"tenantUserEmail" | "tenantUserRole", string>
>;

type TenantUserCredentialSnapshot = {
  email: string;
  password: string;
};

function sortUsers(users: readonly TenantUser[], effectiveUserId: string): TenantUser[] {
  const ownerVisible = users.some((user) => user.isOwner);

  return users
    .map((user, index) => ({ user, index }))
    .sort((left, right) => {
      const leftPriority = left.user.isOwner
        ? 0
        : !ownerVisible && left.user.userId === effectiveUserId
          ? 1
          : 2;
      const rightPriority = right.user.isOwner
        ? 0
        : !ownerVisible && right.user.userId === effectiveUserId
          ? 1
          : 2;

      return leftPriority - rightPriority || left.index - right.index;
    })
    .map(({ user }) => user);
}

export function UsersPage() {
  const { apiClient, impersonation, startImpersonation, showToast } = useTenantShellContext();
  const navigate = useNavigate();
  const isDesktopShell = useIsDesktopShell();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<TenantHostErrorViewModel | null>(null);
  const [tenantUserEmail, setTenantUserEmail] = useState("");
  const [tenantUserRole, setTenantUserRole] = useState<TenantRole>("BinderRead");
  const [fieldErrors, setFieldErrors] = useState<TenantUserFieldErrors>({});
  const [createError, setCreateError] = useState<TenantHostErrorViewModel | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<TenantUserCredentialSnapshot | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TenantRole>>({});
  const [roleUpdateError, setRoleUpdateError] = useState<TenantHostErrorViewModel | null>(null);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);
  const [isRoleUpdatingForUserId, setIsRoleUpdatingForUserId] = useState<string | null>(null);
  const [impersonationError, setImpersonationError] = useState<TenantHostErrorViewModel | null>(null);
  const [isStartingImpersonationForUserId, setIsStartingImpersonationForUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteUserTriggerRef = useRef<HTMLButtonElement>(null);
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState("");
  const [deleteError, setDeleteError] = useState<TenantHostErrorViewModel | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

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

  useEffect(() => {
    if (selectedUserId === null) {
      return;
    }

    if (!users.some((user) => user.userId === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    setIsDeleteDialogOpen(false);
    setDeleteConfirmationEmail("");
    setDeleteError(null);
    setIsDeletingUser(false);
  }, [selectedUserId]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return;
      }

      setCreatedCredentials(null);
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  async function copyValue(label: string, value: string) {
    const copied = await writeClipboardValue(value);
    if (copied) {
      showToast({
        title: `${label} copied.`,
        body: `${label} is ready to paste.`,
        variant: "success"
      });
      return;
    }

    showToast({
      title: `Could not copy ${label.toLowerCase()}.`,
      body: "Clipboard access is not available in this browser session.",
      variant: "warning"
    });
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: TenantUserFieldErrors = {};
    if (!tenantUserEmail.trim()) {
      nextFieldErrors.tenantUserEmail = "Email is required.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setCreateError(null);
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setCreatedCredentials(null);
    setFieldErrors({});

    try {
      const submittedEmail = tenantUserEmail.trim();
      const createdUser = await apiClient.createTenantUser({
        email: submittedEmail,
        role: tenantUserRole
      });

      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setRoleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [createdUser.userId]: createdUser.role
      }));
      setSelectedUserId(createdUser.userId);
      setCreatedCredentials({
        email: createdUser.credentials.email,
        password: createdUser.credentials.password
      });
      setTenantUserEmail("");
      setTenantUserRole("BinderRead");
      showToast({
        title: "User added to workspace.",
        body: `${createdUser.email} can now be managed from this route.`,
        variant: "success"
      });
    } catch (error) {
      const mappedError = mapTenantHostError(error);
      setCreateError(mappedError);
      setFieldErrors(
        mappedError.field === "tenantUserEmail"
          ? { tenantUserEmail: mappedError.detail }
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
    setRoleUpdateSuccess(null);
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
      setRoleUpdateSuccess(updatedUser.email);
      showToast({
        title: "Role updated.",
        body: `${updatedUser.email} now uses ${formatRole(updatedUser.role)}.`,
        variant: "success"
      });
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
      showToast({
        title: "Impersonation started.",
        body: "The workspace is switching to the selected effective user.",
        variant: "info"
      });
      navigate("/app");
    } catch (error) {
      setImpersonationError(mapTenantHostError(error));
    } finally {
      setIsStartingImpersonationForUserId(null);
    }
  }

  async function handleDeleteUser(user: TenantUser) {
    setIsDeletingUser(true);
    setDeleteError(null);

    try {
      await apiClient.deleteTenantUser(user.userId);
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.userId !== user.userId));
      setRoleDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[user.userId];
        return nextDrafts;
      });
      setSelectedUserId(null);
      setIsDeleteDialogOpen(false);
      setDeleteConfirmationEmail("");
      showToast({
        title: "User deleted.",
        body: `${user.email} was removed from this workspace.`,
        variant: "success"
      });
    } catch (error) {
      setDeleteError(mapTenantHostError(error));
    } finally {
      setIsDeletingUser(false);
    }
  }

  if (pageError !== null) {
    return <TenantRouteFailureCard error={pageError} />;
  }

  const orderedUsers = sortUsers(users, impersonation.effective.userId);

  const columns: readonly DataTableColumn[] = [
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "ownership", header: "Ownership" },
    { key: "actions", header: "Actions" }
  ];
  const rows: DataTableRow[] = orderedUsers.map((user) => ({
    key: user.userId,
    cells: [
      <div key={`${user.userId}-email`}>
        <p className="font-medium text-[var(--pb-color-text)]">{user.email}</p>
        <CopyValueChip
          className="mt-2"
          compact
          key={`${user.userId}-id`}
          label={`user id for ${user.email}`}
          onCopy={() => {
            void copyValue("User ID", user.userId);
          }}
          value={user.userId}
        />
      </div>,
      <span key={`${user.userId}-role`} className="font-medium text-[var(--pb-color-text)]">
        {formatRole(user.role)}
      </span>,
      user.isOwner ? <StatusBadge key={`${user.userId}-owner`}>Owner</StatusBadge> : "Member",
      <Button
        key={`${user.userId}-action`}
        aria-label={`Manage user ${user.email}`}
        onClick={() => {
          setSelectedUserId(user.userId);
          setRoleUpdateError(null);
          setImpersonationError(null);
        }}
        type="button"
        variant={selectedUserId === user.userId ? "primary" : "secondary"}
      >
        {selectedUserId === user.userId ? "Managing" : "Manage"}
      </Button>,
    ]
  }));
  const selectedUser =
    selectedUserId === null ? null : orderedUsers.find((user) => user.userId === selectedUserId) ?? null;
  const canStartSelectedUserImpersonation =
    selectedUser !== null &&
    !impersonation.isImpersonating &&
    selectedUser.userId !== impersonation.effective.userId;
  const selectedUserRoleDraft =
    selectedUser === null ? null : (roleDrafts[selectedUser.userId] ?? selectedUser.role);
  const selectedUserRoleIsDirty =
    selectedUser !== null && selectedUserRoleDraft !== null && selectedUserRoleDraft !== selectedUser.role;
  const isSelectedUserSelf =
    selectedUser !== null && selectedUser.userId === impersonation.effective.userId;
  const canDeleteSelectedUser = selectedUser !== null && !selectedUser.isOwner && !isSelectedUserSelf;
  const deleteConfirmationMatchesSelectedUser =
    selectedUser !== null && deleteConfirmationEmail.trim().toLowerCase() === selectedUser.email.toLowerCase();

  return (
    <div className="space-y-5">
      <section className="px-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--pb-color-text-subtle)">
          Access management
        </p>
        <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-(--pb-color-text)">
          Users and access
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-(--pb-color-text-muted)">
          Keep the full user list visible while you add users, change roles, and start view as.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Current users</h3>
            <p className="pb-auth-panel-copy">
              Manage roles and view as actions for this workspace from one page.
            </p>
          </div>
          <div className="pb-auth-panel-body space-y-4">
            {isDesktopShell ? (
              <div className="pb-auth-user-table">
                <DataTable
                  caption="Workspace users"
                  columns={columns}
                  emptyMessage="No workspace users are available."
                  isLoading={isLoading}
                  loadingLabel="Loading workspace users..."
                  rows={rows}
                />
              </div>
            ) : (
              <div aria-label="Workspace users" className="pb-auth-mobile-list" role="list">
                {isLoading ? (
                  <div className="pb-auth-selection-empty" role="status">
                    Loading workspace users...
                  </div>
                ) : orderedUsers.length === 0 ? (
                  <div className="pb-auth-selection-empty">No workspace users are available.</div>
                ) : (
                  orderedUsers.map((user) => (
                    <article className="pb-auth-mobile-list-card" key={user.userId} role="listitem">
                      <div className="pb-auth-mobile-list-card__header">
                        <div className="pb-auth-mobile-list-card__identity">
                          <p className="pb-auth-stat-label">Email</p>
                          <p className="pb-auth-mobile-list-card__title">{user.email}</p>
                        </div>
                        {user.isOwner ? <StatusBadge>Owner</StatusBadge> : <StatusBadge>Member</StatusBadge>}
                      </div>
                      <div className="pb-auth-mobile-list-card__meta">
                        <div>
                          <p className="pb-auth-stat-label">Role</p>
                          <p>{formatRole(user.role)}</p>
                        </div>
                        <div>
                          <p className="pb-auth-stat-label">User ID</p>
                          <CopyValueChip
                            compact
                            label={`user id for ${user.email}`}
                            onCopy={() => {
                              void copyValue("User ID", user.userId);
                            }}
                            value={user.userId}
                          />
                        </div>
                      </div>
                      <Button
                        aria-label={`Manage user ${user.email}`}
                        onClick={() => {
                          setSelectedUserId(user.userId);
                          setRoleUpdateError(null);
                          setImpersonationError(null);
                        }}
                        type="button"
                        variant={selectedUserId === user.userId ? "primary" : "secondary"}
                      >
                        {selectedUserId === user.userId ? "Managing" : "Manage"}
                      </Button>
                    </article>
                  ))
                )}
              </div>
            )}
            <div className="border-t border-[var(--pb-border-subtle)] pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[1.2rem] font-semibold tracking-[-0.03em] text-[var(--pb-color-text)]">
                    Manage selected user
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                    Update roles and start view as without leaving the current user list.
                  </p>
                </div>
                {selectedUser !== null ? (
                  <Button
                    onClick={() => {
                      setSelectedUserId(null);
                      setRoleUpdateError(null);
                      setRoleUpdateSuccess(null);
                      setImpersonationError(null);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    Close panel
                  </Button>
                ) : null}
              </div>

              {selectedUser === null ? (
                <div className="pb-auth-selection-empty mt-4">
                  Select a user to open role and view as actions here.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="pb-auth-meta-grid">
                    <article className="pb-auth-meta-card">
                      <p className="pb-auth-stat-label">User</p>
                      <p className="pb-auth-meta-value">{selectedUser.email}</p>
                    </article>
                    <article className="pb-auth-meta-card">
                      <p className="pb-auth-stat-label">Current role</p>
                      <p className="pb-auth-meta-value">{formatRole(selectedUser.role)}</p>
                    </article>
                    <article className="pb-auth-meta-card">
                      <p className="pb-auth-stat-label">User ID</p>
                      <div className="pb-auth-meta-value">
                        <CopyValueChip
                          compact
                          label={`user id for ${selectedUser.email}`}
                          onCopy={() => {
                            void copyValue("User ID", selectedUser.userId);
                          }}
                          value={selectedUser.userId}
                        />
                      </div>
                    </article>
                    <article className="pb-auth-meta-card">
                      <p className="pb-auth-stat-label">Ownership</p>
                      <div className="pb-auth-meta-value">
                        {selectedUser.isOwner ? (
                          <StatusBadge variant="success">Owner</StatusBadge>
                        ) : (
                          <StatusBadge>Member</StatusBadge>
                        )}
                      </div>
                    </article>
                  </div>

                  <div className="pb-auth-inline-panels">
                    <section className="pb-auth-subpanel">
                      <div className="pb-auth-subpanel-header">
                        <h4 className="text-base font-semibold tracking-[-0.02em] text-[var(--pb-color-text)]">
                          Change role
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                          Update the effective role used when this user signs into the workspace.
                        </p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <Field
                          hint="Choose the role this user should have in the workspace."
                          label={`Role for ${selectedUser.email}`}
                        >
                          <select
                            disabled={isRoleUpdatingForUserId === selectedUser.userId}
                            onChange={(event) => {
                              setRoleDrafts((currentDrafts) => ({
                                ...currentDrafts,
                                [selectedUser.userId]: event.target.value as TenantRole
                              }));
                              setRoleUpdateError(null);
                              setRoleUpdateSuccess(null);
                            }}
                            value={roleDrafts[selectedUser.userId] ?? selectedUser.role}
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {formatRole(role)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <TenantHostErrorNotice error={roleUpdateError} />
                        {roleUpdateSuccess ? (
                          <Alert variant="success">
                            <AlertTitle>Role saved.</AlertTitle>
                            <AlertBody>{roleUpdateSuccess} now uses the selected role.</AlertBody>
                          </Alert>
                        ) : null}
                        <Button
                          className="w-full justify-center sm:w-auto"
                          disabled={!selectedUserRoleIsDirty || isRoleUpdatingForUserId === selectedUser.userId}
                          isLoading={isRoleUpdatingForUserId === selectedUser.userId}
                          onClick={() => void handleRoleChange(selectedUser.userId)}
                          type="button"
                          variant="secondary"
                        >
                          Save role
                        </Button>
                      </div>
                    </section>

                    <section className="pb-auth-subpanel">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold tracking-[-0.02em] text-[var(--pb-color-text)]">
                            View as
                          </h4>
                          <p className="mt-1 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                            Start view as from this user-management page.
                          </p>
                        </div>
                        {canStartSelectedUserImpersonation ? (
                          <StatusBadge variant="success">Eligible on this screen</StatusBadge>
                        ) : (
                          <StatusBadge variant="warning">Not eligible</StatusBadge>
                        )}
                      </div>
                      <div className="mt-4 space-y-4">
                        <TenantHostErrorNotice error={impersonationError} />
                        <p className="text-sm leading-6 text-[var(--pb-color-text-muted)]">
                          {canStartSelectedUserImpersonation
                            ? "Use view as to confirm the workspace experience for the selected member."
                            : impersonation.isImpersonating
                              ? "Stop the current view as session before starting another one."
                              : "You cannot start view as for the current effective user."}
                        </p>
                        {canStartSelectedUserImpersonation ? (
                          <Button
                            className="w-full justify-center sm:w-auto"
                            isLoading={isStartingImpersonationForUserId === selectedUser.userId}
                            onClick={() => void handleStartImpersonation(selectedUser.userId)}
                            type="button"
                            variant="secondary"
                          >
                            View as this user
                          </Button>
                        ) : null}
                      </div>
                    </section>

                    <section className="pb-auth-subpanel pb-auth-subpanel--danger">
                      <div className="pb-auth-subpanel-header">
                        <h4 className="text-base font-semibold tracking-[-0.02em] text-[var(--pb-color-text)]">
                          Delete user
                        </h4>
                        <p className="mt-1 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                          Remove this workspace user.
                        </p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <TenantHostErrorNotice error={deleteError} />
                        {selectedUser.isOwner ? (
                          <Alert variant="info">
                            <AlertTitle>Owner deletion is disabled.</AlertTitle>
                            <AlertBody>The workspace owner cannot be deleted.</AlertBody>
                          </Alert>
                        ) : isSelectedUserSelf ? (
                          <Alert variant="info">
                            <AlertTitle>Self-deletion is disabled.</AlertTitle>
                            <AlertBody>You cannot remove the current effective user from this screen.</AlertBody>
                          </Alert>
                        ) : null}
                        <Button
                          className="w-full justify-center sm:w-auto"
                          disabled={!canDeleteSelectedUser}
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteConfirmationEmail("");
                            setIsDeleteDialogOpen(true);
                          }}
                          ref={deleteUserTriggerRef}
                          type="button"
                          variant="danger"
                        >
                          Delete user
                        </Button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="pb-auth-panel">
          <div className="pb-auth-panel-header">
            <h3 className="pb-auth-panel-title pb-auth-panel-title--lg">Add user</h3>
            <p className="pb-auth-panel-copy">
              Create a workspace member with an initial role. PaperBinder issues the workspace password on the server and shows it once after creation.
            </p>
          </div>
          <div className="pb-auth-panel-body">
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <Field
                error={fieldErrors.tenantUserEmail}
                hint="Use the email this workspace member will sign in with."
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
                error={fieldErrors.tenantUserRole}
                hint="Each workspace member has one assigned role."
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
              <Button
                className="w-full justify-center sm:w-auto"
                disabled={!tenantUserEmail.trim() || isCreating}
                isLoading={isCreating}
                type="submit"
              >
                Add user
              </Button>
            </form>
            {createdCredentials ? (
              <Alert className="mt-4" variant="success">
                <AlertTitle>User added.</AlertTitle>
                <AlertBody>{createdCredentials.email} was added to this workspace.</AlertBody>
                <AlertBody>Save these credentials now if you need to hand them to the user.</AlertBody>
                <div className="mt-4 space-y-3">
                  <CredentialDisplayField
                    copyButtonLabel={`Copy workspace email for ${createdCredentials.email}`}
                    hint="Use this email for the user's first sign-in."
                    label="Workspace email"
                    onCopyResult={(copied) => {
                      if (!copied) {
                        showToast({
                          title: "Could not copy user email.",
                          body: "Clipboard access is not available in this browser session.",
                          variant: "warning"
                        });
                        return;
                      }

                      showToast({
                        title: "User email copied.",
                        body: "User email is ready to paste.",
                        variant: "success"
                      });
                    }}
                    value={createdCredentials.email}
                    variant="auth"
                  />
                  <CredentialDisplayField
                    copyButtonLabel={`Copy workspace password for ${createdCredentials.email}`}
                    hideButtonLabel="Hide workspace password"
                    hint="This password won't be shown again."
                    label="Workspace password"
                    onCopyResult={(copied) => {
                      if (!copied) {
                        showToast({
                          title: "Could not copy workspace password.",
                          body: "Clipboard access is not available in this browser session.",
                          variant: "warning"
                        });
                        return;
                      }

                      showToast({
                        title: "Workspace password copied.",
                        body: "Workspace password is ready to paste.",
                        variant: "success"
                      });
                    }}
                    sensitive
                    showButtonLabel="Show workspace password"
                    value={createdCredentials.password}
                    variant="auth"
                  />
                </div>
              </Alert>
            ) : null}
          </div>
        </section>
      </div>

      {selectedUser !== null ? (
        <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
          <DialogContent
            description={`Type ${selectedUser.email} to confirm removal from this workspace.`}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              deleteUserTriggerRef.current?.focus();
            }}
            title={`Delete ${selectedUser.email}?`}
          >
            <Field
              hint="This action removes the user from the current workspace."
              label="Confirm email"
            >
              <input
                autoComplete="off"
                disabled={isDeletingUser}
                onChange={(event) => {
                  setDeleteConfirmationEmail(event.target.value);
                  setDeleteError(null);
                }}
                placeholder={selectedUser.email}
                type="text"
                value={deleteConfirmationEmail}
              />
            </Field>
            <TenantHostErrorNotice error={deleteError} />
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                }}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !deleteConfirmationMatchesSelectedUser ||
                  isDeletingUser ||
                  selectedUser.isOwner ||
                  isSelectedUserSelf
                }
                isLoading={isDeletingUser}
                onClick={() => void handleDeleteUser(selectedUser)}
                type="button"
                variant="danger"
              >
                Delete user
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
