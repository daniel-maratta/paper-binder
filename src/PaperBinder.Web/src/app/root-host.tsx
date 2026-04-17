import { Fragment, type FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, Route } from "react-router-dom";
import type { LoginResponse, PaperBinderApiClient, ProvisionResponse } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMeta,
  CardTitle
} from "../components/ui/card";
import { Field } from "../components/ui/field";
import { cn } from "../lib/cn";
import { RootHostChallengeWidget } from "./challenge-widget";
import type { RootHostContext } from "./host-context";
import { rootRouteDefinitions } from "./route-registry";
import { mapRootHostError, type RootHostErrorViewModel } from "./root-host-errors";

type RootHostFieldErrors = Partial<Record<"tenantName" | "email" | "password" | "challenge", string>>;

export type RootHostNavigator = (redirectUrl: string) => void;

function defaultRootHostNavigator(redirectUrl: string) {
  window.location.assign(redirectUrl);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function isAbsoluteRedirectUrl(redirectUrl: string): boolean {
  try {
    new URL(redirectUrl);
    return true;
  } catch {
    return false;
  }
}

function createRedirectError(): RootHostErrorViewModel {
  return {
    title: "Redirect could not be completed.",
    detail: "The server response did not include a valid redirect target. Retry the request.",
    field: null,
    correlationId: null,
    retryAfterLabel: null
  };
}

function RootHostErrorNotice({ error }: { error: RootHostErrorViewModel | null }) {
  if (error === null) {
    return null;
  }

  return (
    <Alert variant="danger">
      <AlertTitle>{error.title}</AlertTitle>
      <AlertBody>{error.detail}</AlertBody>
      {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
      {error.correlationId ? (
        <AlertBody>
          Correlation id:{" "}
          <span className="font-mono text-xs uppercase tracking-[0.08em]">{error.correlationId}</span>
        </AlertBody>
      ) : null}
    </Alert>
  );
}

function RootShell({ hostContext }: { hostContext: RootHostContext }) {
  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] text-[var(--pb-color-text)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/85 px-6 py-5 shadow-[var(--pb-shadow-card)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
              PaperBinder
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Root-host onboarding</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
              Provision a demo tenant or log in with existing credentials. Redirect routing stays
              server-authoritative, and tenant-host feature work remains out of scope until CP14.
            </p>
          </div>
          <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3 text-sm text-[var(--pb-color-text-muted)]">
            <p className="font-semibold text-[var(--pb-color-text)]">
              {hostContext.debugAlias ? "Loopback root-host debug alias" : "Canonical root host"}
            </p>
            <p className="mt-1 break-all">{hostContext.currentOrigin}</p>
          </div>
        </header>

        <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/80 p-4 shadow-[var(--pb-shadow-card)] backdrop-blur">
            <nav aria-label="Root host navigation" className="space-y-1">
              {rootRouteDefinitions.map((route) => (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "block rounded-[var(--pb-radius-md)] px-4 py-3 text-sm transition",
                      isActive
                        ? "bg-[var(--pb-color-primary)] text-white"
                        : "text-[var(--pb-color-text-muted)] hover:bg-[var(--pb-color-panel-muted)] hover:text-[var(--pb-color-text)]"
                    )
                  }
                  end={route.path === "/"}
                  key={route.path}
                  to={route.path}
                >
                  <span className="block font-semibold">{route.label}</span>
                  <span className="mt-1 block text-xs opacity-80">{route.description}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="pb-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function ProvisionSuccessCard({
  provisionedTenant,
  onContinue
}: {
  provisionedTenant: ProvisionResponse;
  onContinue: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant provisioned.</CardTitle>
        <CardDescription>
          PaperBinder already established the signed-in session. These generated credentials are shown
          once from the provisioning response and are not stored in the browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="warning">
          <AlertTitle>Copy the credentials now</AlertTitle>
          <AlertBody>
            Continue to the tenant host only after you have recorded the generated email and password.
          </AlertBody>
        </Alert>
        <div className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Tenant slug" value={provisionedTenant.tenantSlug} />
          <CardMeta label="Lease expires" value={formatDateTime(provisionedTenant.expiresAt)} />
          <CardMeta label="Tenant app" value={<code>/app</code>} />
        </div>
        <Field hint="Generated by the server during provisioning." label="Email">
          <input className="font-mono" readOnly type="email" value={provisionedTenant.credentials.email} />
        </Field>
        <Field hint="Shown once on the root host handoff." label="Password">
          <input className="font-mono" readOnly type="text" value={provisionedTenant.credentials.password} />
        </Field>
      </CardContent>
      <CardFooter>
        <Button onClick={onContinue} type="button">
          Continue to tenant
        </Button>
        <Button asChild type="button" variant="secondary">
          <NavLink to="/login">Go to login</NavLink>
        </Button>
      </CardFooter>
    </Card>
  );
}

function RootWelcomePage({
  apiClient,
  hostContext,
  navigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: RootHostContext;
  navigator: RootHostNavigator;
}) {
  const [tenantName, setTenantName] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RootHostFieldErrors>({});
  const [error, setError] = useState<RootHostErrorViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeResetNonce, setChallengeResetNonce] = useState(0);
  const [provisionedTenant, setProvisionedTenant] = useState<ProvisionResponse | null>(null);

  async function handleProvisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: RootHostFieldErrors = {};
    if (!tenantName.trim()) {
      nextFieldErrors.tenantName = "Tenant name is required.";
    }

    if (!challengeToken) {
      nextFieldErrors.challenge = "Complete the challenge before submitting.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    const resolvedChallengeToken = challengeToken!;
    setIsSubmitting(true);
    setFieldErrors({});
    setError(null);

    try {
      const response = await apiClient.provision({
        tenantName: tenantName.trim(),
        challengeToken: resolvedChallengeToken
      });

      if (!isAbsoluteRedirectUrl(response.redirectUrl)) {
        setError(createRedirectError());
        return;
      }

      setProvisionedTenant(response);
    } catch (caughtError) {
      const mappedError = mapRootHostError(caughtError);
      setError(mappedError);
      setFieldErrors(mappedError.field ? { [mappedError.field]: mappedError.detail } : {});
      setChallengeToken(null);
      setChallengeResetNonce((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinueToTenant() {
    if (provisionedTenant === null) {
      return;
    }

    if (!isAbsoluteRedirectUrl(provisionedTenant.redirectUrl)) {
      setError(createRedirectError());
      return;
    }

    navigator(provisionedTenant.redirectUrl);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provision a demo tenant</CardTitle>
          <CardDescription>
            Create a disposable tenant from the root host. PaperBinder normalizes the tenant name
            server-side and returns the only redirect target the browser is allowed to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <dl className="space-y-4 md:col-span-2 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
            <CardMeta label="Root host" value={hostContext.environment.rootUrl} />
            <CardMeta label="API base" value={hostContext.environment.apiBaseUrl} />
            <CardMeta label="Tenant base" value={hostContext.environment.tenantBaseDomain} />
          </dl>
          <Alert variant="info">
            <AlertTitle>Checkpoint scope</AlertTitle>
            <AlertBody>
              Root-host onboarding is live in CP13. Tenant-host binders, documents, users, and lease
              interactions remain deferred to CP14.
            </AlertBody>
          </Alert>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {provisionedTenant ? (
          <ProvisionSuccessCard onContinue={handleContinueToTenant} provisionedTenant={provisionedTenant} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create a tenant</CardTitle>
              <CardDescription>
                Submit the tenant name and challenge proof through the shared API client. Required-field
                validation stays minimal; server-side validation remains authoritative.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProvisionSubmit}>
                <Field
                  error={fieldErrors.tenantName}
                  hint="PaperBinder trims and normalizes this into the tenant slug on the server."
                  label="Tenant name"
                >
                  <input
                    disabled={isSubmitting}
                    onChange={(event) => {
                      setTenantName(event.target.value);
                      setFieldErrors((currentErrors) => ({ ...currentErrors, tenantName: undefined }));
                      setError(null);
                    }}
                    placeholder="Acme Demo"
                    type="text"
                    value={tenantName}
                  />
                </Field>
                <RootHostChallengeWidget
                  error={fieldErrors.challenge}
                  hint="PaperBinder requires challenge proof before provisioning or login requests are accepted."
                  label="Challenge"
                  onTokenChange={setChallengeToken}
                  resetNonce={challengeResetNonce}
                  scriptUrl={hostContext.environment.challengeScriptUrl}
                  siteKey={hostContext.environment.challengeSiteKey}
                />
                <RootHostErrorNotice error={error} />
                <div className="flex flex-wrap gap-3">
                  <Button isLoading={isSubmitting} type="submit">
                    Provision new demo tenant and log in
                  </Button>
                  <Button asChild type="button" variant="secondary">
                    <NavLink to="/login">Log in instead</NavLink>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>What this root-host flow guarantees</CardTitle>
            <CardDescription>
              The browser stays inside the existing single SPA and defers all tenant routing authority to
              the server responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
              <li>Provisioning sends only tenant name plus challenge token through the shared API client.</li>
              <li>Generated credentials remain transient in memory only and are never written into browser storage.</li>
              <li>Redirect navigation uses only the absolute `redirectUrl` returned by the server.</li>
              <li>ProblemDetails responses surface safe challenge, credential, rate-limit, and expiry guidance.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RootLoginPage({
  apiClient,
  hostContext,
  navigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: RootHostContext;
  navigator: RootHostNavigator;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RootHostFieldErrors>({});
  const [error, setError] = useState<RootHostErrorViewModel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeResetNonce, setChallengeResetNonce] = useState(0);
  const [redirect, setRedirect] = useState<LoginResponse | null>(null);

  useEffect(() => {
    if (redirect === null) {
      return;
    }

    if (!isAbsoluteRedirectUrl(redirect.redirectUrl)) {
      setError(createRedirectError());
      return;
    }

    navigator(redirect.redirectUrl);
  }, [navigator, redirect]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: RootHostFieldErrors = {};
    if (!email.trim()) {
      nextFieldErrors.email = "Email is required.";
    }

    if (!password.trim()) {
      nextFieldErrors.password = "Password is required.";
    }

    if (!challengeToken) {
      nextFieldErrors.challenge = "Complete the challenge before submitting.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    const resolvedChallengeToken = challengeToken!;
    setIsSubmitting(true);
    setFieldErrors({});
    setError(null);

    try {
      const response = await apiClient.login({
        email: email.trim(),
        password,
        challengeToken: resolvedChallengeToken
      });

      if (!isAbsoluteRedirectUrl(response.redirectUrl)) {
        setError(createRedirectError());
        return;
      }

      setRedirect(response);
    } catch (caughtError) {
      const mappedError = mapRootHostError(caughtError);
      setError(mappedError);
      setFieldErrors(mappedError.field ? { [mappedError.field]: mappedError.detail } : {});
      setChallengeToken(null);
      setChallengeResetNonce((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinueManually() {
    if (redirect === null) {
      return;
    }

    if (!isAbsoluteRedirectUrl(redirect.redirectUrl)) {
      setError(createRedirectError());
      return;
    }

    navigator(redirect.redirectUrl);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in to an existing tenant</CardTitle>
        <CardDescription>
          Use the generated email and password from provisioning. Redirect resolution stays on the server
          so the browser never builds tenant URLs from user input.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <Field
            error={fieldErrors.email}
            hint="Email is the canonical v1 identity label for root-host login."
            label="Email"
          >
            <input
              disabled={isSubmitting || redirect !== null}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
                setError(null);
              }}
              placeholder="owner@tenant.local"
              type="email"
              value={email}
            />
          </Field>
          <Field
            error={fieldErrors.password}
            hint="PaperBinder uses the existing cookie-auth session model after successful login."
            label="Password"
          >
            <input
              disabled={isSubmitting || redirect !== null}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
                setError(null);
              }}
              placeholder="Generated password"
              type="password"
              value={password}
            />
          </Field>
          <RootHostChallengeWidget
            error={fieldErrors.challenge}
            hint="Challenge proof is required for root-host login and resets after retriable failures."
            label="Challenge"
            onTokenChange={setChallengeToken}
            resetNonce={challengeResetNonce}
            scriptUrl={hostContext.environment.challengeScriptUrl}
            siteKey={hostContext.environment.challengeSiteKey}
          />
          <RootHostErrorNotice error={error} />
          {redirect ? (
            <Alert variant="info">
              <AlertTitle>Redirecting to tenant host</AlertTitle>
              <AlertBody>The browser is continuing with the server-provided redirect target.</AlertBody>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button isLoading={isSubmitting} type="submit">
              Log in
            </Button>
            <Button asChild type="button" variant="secondary">
              <NavLink to="/">Back to provision</NavLink>
            </Button>
          </div>
        </form>
      </CardContent>
      {redirect ? (
        <CardFooter>
          <Button onClick={handleContinueManually} type="button" variant="secondary">
            Continue manually
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function RootAboutPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About root-host onboarding</CardTitle>
          <CardDescription>
            CP13 activates the browser entry flow while keeping tenant-host CRUD, lease interaction, and
            logout polish deferred to later checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Architecture" value="Single React SPA, direct API calls, no BFF" />
          <CardMeta label="Provisioning handoff" value="Show credentials once, then continue" />
          <CardMeta label="Browser E2E" value="Dedicated root-host suite" />
        </CardContent>
        <CardFooter>
          <Alert variant="info">
            <AlertTitle>Still out of scope</AlertTitle>
            <AlertBody>
              Tenant-host dashboard data, binders, documents, tenant users, lease extension, and logout UX stay
              in the later CP14 scope boundary.
            </AlertBody>
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}

function RootNotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Route not available on the root host</CardTitle>
        <CardDescription>
          Unknown root-host routes remain inside the root shell instead of redirecting into tenant route
          space or inferring tenant identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="warning">
          <AlertTitle>Known root routes</AlertTitle>
          <AlertBody>
            <code>/</code>, <code>/login</code>, and <code>/about</code> are the canonical root-host routes
            for CP13.
          </AlertBody>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function RootHostRoutes({
  apiClient,
  hostContext,
  navigator = defaultRootHostNavigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: RootHostContext;
  navigator?: RootHostNavigator;
}) {
  return (
    <Fragment>
      <Route element={<RootShell hostContext={hostContext} />}>
        <Route element={<RootWelcomePage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/" />
        <Route element={<RootLoginPage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/login" />
        <Route element={<RootAboutPage />} path="/about" />
        <Route element={<RootNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
