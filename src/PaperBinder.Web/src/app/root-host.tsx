import { Fragment, type FormEvent, useEffect, useState } from "react";
import { NavLink, Outlet, Route, useLocation } from "react-router-dom";
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
import { StatusBadge } from "../components/ui/status-badge";
import { cn } from "../lib/cn";
import { RootHostChallengeWidget } from "./challenge-widget";
import type { RootHostContext } from "./host-context";
import { rootRouteDefinitions } from "./route-registry";
import { mapRootHostError, type RootHostErrorViewModel } from "./root-host-errors";

type RootHostFieldErrors = Partial<Record<"tenantName" | "email" | "password" | "challenge", string>>;

export type RootHostNavigator = (redirectUrl: string) => void;

const localChallengeBypassToken = "paperbinder-test-challenge-pass";

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
  const location = useLocation();
  const isDemoRoute = location.pathname === "/start-demo";

  return (
    <div className="min-h-screen bg-[var(--pb-surface-gradient)] text-[var(--pb-color-text)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[var(--pb-radius-lg)] border border-white/70 bg-white/85 px-6 py-5 shadow-[var(--pb-shadow-card)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--pb-color-text-subtle)]">
              PaperBinder
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Secure document workspaces</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
              Product-led public entry, disposable live demo workspaces, and a tenant-host experience that
              stays grounded in server-authoritative routing and access boundaries.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <Button asChild type="button" variant={isDemoRoute ? "secondary" : "primary"}>
              <NavLink to="/start-demo">{isDemoRoute ? "Demo workspace route" : "Start Demo"}</NavLink>
            </Button>
            <div className="rounded-[var(--pb-radius-md)] bg-[var(--pb-color-panel-muted)] px-4 py-3 text-sm text-[var(--pb-color-text-muted)]">
              <p className="font-semibold text-[var(--pb-color-text)]">
                {hostContext.debugAlias ? "Loopback root-host debug alias" : "Canonical root host"}
              </p>
              <p className="mt-1 break-all">{hostContext.currentOrigin}</p>
            </div>
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

function RootLandingPage() {
  const proofPillars = [
    {
      title: "Isolation",
      body: "Each workspace stays separated by tenant-aware routing and access boundaries."
    },
    {
      title: "Access control",
      body: "Users, binders, and actions stay shaped by role-aware permissions."
    },
    {
      title: "Visibility",
      body: "Review binders, document detail, and active workspace state inside the live product."
    }
  ] as const;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-[rgba(8,20,35,0.08)] bg-[linear-gradient(135deg,rgba(7,20,35,0.98),rgba(18,41,69,0.96))] text-[var(--pb-public-text)]">
        <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.02fr_0.98fr] lg:p-8">
          <section className="space-y-6">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--pb-public-text-muted)]">
                PaperBinder
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--pb-public-text)]">
                A secure workspace for your documents and your team.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pb-public-text-muted)]">
                Multi-tenant by design. Built for organized review, controlled access, and clear visibility.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="border-white/10 bg-white text-[#081528] hover:border-white/20 hover:bg-[#f6f9fd]" type="button" variant="secondary">
                <NavLink to="/start-demo">Start Demo</NavLink>
              </Button>
              <Button asChild className="border-white/12 bg-white/6 text-white hover:border-white/18 hover:bg-white/10" type="button" variant="secondary">
                <NavLink to="/about">Learn more</NavLink>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {proofPillars.map((pillar) => (
                <div
                  className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur"
                  key={pillar.title}
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/50">
                    {pillar.title}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/90">{pillar.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="Live workspace preview" className="rounded-[30px] border border-white/10 bg-[rgba(255,255,255,0.08)] p-4 shadow-[0_34px_88px_-48px_rgba(0,0,0,0.72)] backdrop-blur">
            <div className="rounded-[24px] border border-white/8 bg-[rgba(8,17,29,0.6)] px-4 py-3 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white/60">
              Live workspace preview
            </div>
            <div className="mt-4 rounded-[24px] bg-[linear-gradient(180deg,#f7fbff_0%,#eef4fa_100%)] p-5 text-[var(--pb-color-text)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pb-color-text-subtle)]">
                    Workspace
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--pb-color-text)]">
                    Binders, documents, and access in one place
                  </h3>
                </div>
                <StatusBadge variant="success">Live demo</StatusBadge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <CardMeta className="min-h-[6rem]" label="Binders" value="Grouped workspaces" />
                <CardMeta className="min-h-[6rem]" label="Documents" value="Readable source detail" />
                <CardMeta className="min-h-[6rem]" label="Users" value="Role-aware actions" />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[22px] border border-[var(--pb-border-subtle)] bg-white px-4 py-4 shadow-[var(--pb-shadow-card)]">
                  <p className="text-sm font-semibold text-[var(--pb-color-text)]">What you can do here</p>
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                    <li>Review binders and open document detail pages inside the live workspace.</li>
                    <li>See lease state, visible content, and role-aware user-management entry points.</li>
                    <li>Inspect a real product surface instead of starting with provisioning mechanics.</li>
                  </ul>
                </div>
                <div className="rounded-[22px] border border-[var(--pb-border-subtle)] bg-[linear-gradient(180deg,rgba(244,248,252,0.96),rgba(236,242,248,0.9))] px-4 py-4">
                  <p className="text-sm font-semibold text-[var(--pb-color-text)]">Live demo path</p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                    <p>Start a disposable workspace, receive one-time credentials, and continue into the tenant-host product routes.</p>
                    <p>Direct sign-in still exists for return trips, but the product path now leads with the software itself.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader>
            <CardTitle>A document workspace that feels like real software.</CardTitle>
            <CardDescription>
              PaperBinder groups work into binders, documents, and tenant user controls inside an isolated
              workspace. The public path now shows the product first instead of leading with setup mechanics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
            <p>Binder-based organization keeps grouped work easy to review.</p>
            <p>Document detail pages combine readable metadata with immutable source content.</p>
            <p>User management remains role-aware, tenant-scoped, and grounded in the live authenticated product.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live demo, honest scope.</CardTitle>
            <CardDescription>
              PaperBinder is presented as a real product-style demo artifact. Technical context remains available
              without taking over the main story.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-center sm:w-auto" type="button">
              <NavLink to="/start-demo">Start Demo</NavLink>
            </Button>
            <Button asChild className="w-full justify-center sm:w-auto" type="button" variant="secondary">
              <NavLink to="/login">Use existing demo credentials</NavLink>
            </Button>
            <Button asChild className="w-full justify-center sm:w-auto" type="button" variant="secondary">
              <NavLink to="/about">About PaperBinder</NavLink>
            </Button>
          </CardContent>
        </Card>
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
        <CardTitle>Workspace ready.</CardTitle>
        <CardDescription>
          PaperBinder already established the signed-in session. These one-time credentials are shown now
          and are not stored in the browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="warning">
          <AlertTitle>Save these credentials now</AlertTitle>
          <AlertBody>
            Open the workspace only after you have recorded the generated email and password.
          </AlertBody>
        </Alert>
        <div className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Tenant slug" value={provisionedTenant.tenantSlug} />
          <CardMeta label="Lease expires" value={formatDateTime(provisionedTenant.expiresAt)} />
          <CardMeta label="Workspace route" value={<code>/app</code>} />
        </div>
        <Field hint="Generated for this disposable workspace." label="Email">
          <input className="font-mono" readOnly type="email" value={provisionedTenant.credentials.email} />
        </Field>
        <Field hint="Shown once during this root-host handoff." label="Password">
          <input className="font-mono" readOnly type="text" value={provisionedTenant.credentials.password} />
        </Field>
      </CardContent>
      <CardFooter>
        <Button onClick={onContinue} type="button">
          Open workspace
        </Button>
        <Button asChild type="button" variant="secondary">
          <NavLink to="/login">Use sign in instead</NavLink>
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
  const challengeLocalBypassEnabled = hostContext.environment.challengeLocalBypassEnabled;

  async function handleProvisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFieldErrors: RootHostFieldErrors = {};
    if (!tenantName.trim()) {
      nextFieldErrors.tenantName = "Tenant name is required.";
    }

    if (!challengeLocalBypassEnabled && !challengeToken) {
      nextFieldErrors.challenge = "Complete the challenge before submitting.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    const resolvedChallengeToken = challengeLocalBypassEnabled ? localChallengeBypassToken : challengeToken!;
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
      <section className="space-y-3 px-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--pb-color-text-subtle)]">
          Demo entry
        </p>
        <h2 className="text-[2.15rem] font-semibold tracking-[-0.04em] text-[var(--pb-color-text)]">
          Start a live demo workspace
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[var(--pb-color-text-muted)]">
          Create a disposable PaperBinder workspace and continue directly into the live product.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {provisionedTenant ? (
          <ProvisionSuccessCard onContinue={handleContinueToTenant} provisionedTenant={provisionedTenant} />
        ) : (
          <Card className="border-white/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,254,0.95))]">
            <CardHeader>
              <CardTitle>New demo workspace</CardTitle>
              <CardDescription>
                Enter a workspace name and start a temporary demo tenant. Validation and redirect decisions
                remain server-controlled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProvisionSubmit}>
                <Field
                  error={fieldErrors.tenantName}
                  hint="PaperBinder normalizes the workspace name on the server and returns the approved destination."
                  label="Workspace name"
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
                {challengeLocalBypassEnabled ? (
                  <Alert variant="info">
                    <AlertTitle>Local challenge bypass enabled</AlertTitle>
                    <AlertBody>
                      Root-host challenge verification is temporarily bypassed for this local runtime.
                    </AlertBody>
                  </Alert>
                ) : (
                  <RootHostChallengeWidget
                    error={fieldErrors.challenge}
                    hint="PaperBinder requires challenge proof before provisioning or login requests are accepted."
                    label="Challenge"
                    onTokenChange={setChallengeToken}
                    resetNonce={challengeResetNonce}
                    scriptUrl={hostContext.environment.challengeScriptUrl}
                    siteKey={hostContext.environment.challengeSiteKey}
                  />
                )}
                <RootHostErrorNotice error={error} />
                <div className="flex flex-wrap gap-3">
                  <Button isLoading={isSubmitting} type="submit">
                    Start demo workspace
                  </Button>
                  <Button asChild type="button" variant="secondary">
                    <NavLink to="/login">Log in instead</NavLink>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Use existing demo credentials</CardTitle>
              <CardDescription>
                Return to a previously created demo workspace with valid credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-center sm:w-auto" type="button" variant="secondary">
                <NavLink to="/login">Go to login</NavLink>
              </Button>
              <p className="text-sm leading-6 text-[var(--pb-color-text-muted)]">
                Root-host sign in stays available for return trips and still uses the same server-provided redirect flow.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(252,254,255,0.98),rgba(244,248,253,0.95))]">
            <CardHeader>
              <CardTitle>Demo entry notes</CardTitle>
              <CardDescription>
                The entry path is product-led, but the root-host security and redirect boundaries stay unchanged.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[calc(var(--pb-radius-lg)-4px)] border border-[var(--pb-border-subtle)] bg-white px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--pb-color-text-subtle)]">
                  Small note
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                  Demo workspaces are temporary and may expire automatically.
                </p>
              </div>
              <div className="rounded-[calc(var(--pb-radius-lg)-4px)] border border-[var(--pb-border-subtle)] bg-white px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--pb-color-text-subtle)]">
                  What stays true
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--pb-color-text-muted)]">
                  <li>Provisioning sends only workspace name plus challenge token through the shared SPA client.</li>
                  <li>Generated credentials remain transient in memory only and are never written into browser storage.</li>
                  <li>Redirect navigation uses only the absolute `redirectUrl` returned by the server.</li>
                  <li>ProblemDetails responses surface safe challenge, credential, rate-limit, and expiry guidance.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
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
  const challengeLocalBypassEnabled = hostContext.environment.challengeLocalBypassEnabled;

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

    if (!challengeLocalBypassEnabled && !challengeToken) {
      nextFieldErrors.challenge = "Complete the challenge before submitting.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(null);
      return;
    }

    const resolvedChallengeToken = challengeLocalBypassEnabled ? localChallengeBypassToken : challengeToken!;
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
    <Card className="bg-[linear-gradient(180deg,rgba(252,254,255,0.98),rgba(244,248,253,0.95))]">
      <CardHeader>
        <CardTitle>Sign in to a demo workspace</CardTitle>
        <CardDescription>
          Return to a previously provisioned workspace with valid credentials. Redirect resolution stays on
          the server so the browser never builds tenant URLs from user input.
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
          {challengeLocalBypassEnabled ? (
            <Alert variant="info">
              <AlertTitle>Local challenge bypass enabled</AlertTitle>
              <AlertBody>
                Root-host challenge verification is temporarily bypassed for this local runtime.
              </AlertBody>
            </Alert>
          ) : (
            <RootHostChallengeWidget
              error={fieldErrors.challenge}
              hint="Challenge proof is required for root-host login and resets after retriable failures."
              label="Challenge"
              onTokenChange={setChallengeToken}
              resetNonce={challengeResetNonce}
              scriptUrl={hostContext.environment.challengeScriptUrl}
              siteKey={hostContext.environment.challengeSiteKey}
            />
          )}
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
              <NavLink to="/start-demo">Back to start demo</NavLink>
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
          <CardTitle>About PaperBinder</CardTitle>
          <CardDescription>
            PaperBinder is a constrained multi-tenant document workspace demo designed to show coherent
            product thinking, role-aware access, and reviewable implementation depth.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <CardMeta label="Core objects" value="Binders and immutable text documents" />
          <CardMeta label="Access model" value="Role-aware and tenant-isolated" />
          <CardMeta label="Live demo path" value="Product first, then disposable workspace entry" />
        </CardContent>
        <CardFooter>
          <Alert variant="info">
            <AlertTitle>Intentionally constrained scope</AlertTitle>
            <AlertBody>
              PaperBinder leads with a real product surface, but it does not pretend to be a fully expanded
              collaboration suite or a broad enterprise platform.
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
            <code>/</code>, <code>/start-demo</code>, <code>/login</code>, and <code>/about</code> are the
            canonical root-host routes for the current presentation cut.
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
        <Route element={<RootLandingPage />} path="/" />
        <Route element={<RootWelcomePage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/start-demo" />
        <Route element={<RootLoginPage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/login" />
        <Route element={<RootAboutPage />} path="/about" />
        <Route element={<RootNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
