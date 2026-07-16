import { Fragment, type ComponentPropsWithoutRef, type FormEvent, type ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, Route, useLocation } from "react-router-dom";
import type { LoginResponse, PaperBinderApiClient, ProvisionResponse } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { cn } from "../lib/cn";
import { RootHostChallengeWidget } from "./challenge-widget";
import { writeClipboardValue } from "./copy-value-chip";
import type { RootHostContext } from "./host-context";
import { rootRouteDefinitions } from "./route-registry";
import { mapRootHostError, type RootHostErrorViewModel } from "./root-host-errors";

type RootHostFieldErrors = Partial<Record<"tenantName" | "email" | "password" | "challenge", string>>;

type PublicValuePillar = {
  title: string;
  body: string;
};

export type RootHostNavigator = (redirectUrl: string) => void;

const localChallengeBypassToken = "paperbinder-test-challenge-pass";

const publicValuePillars: PublicValuePillar[] = [
  {
    title: "Isolation",
    body: "Each tenant stays inside its own workspace boundary."
  },
  {
    title: "Access control",
    body: "Binders, documents, and users remain role-aware."
  },
  {
    title: "Visibility",
    body: "Review the product itself instead of a marketing abstraction."
  },
  {
    title: "Disposable demo",
    body: "Each workspace is temporary and removed during periodic cleanup."
  }
];

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
    detail: "PaperBinder did not return a valid destination for this handoff. Try again.",
    field: null,
    correlationId: null,
    retryAfterLabel: null
  };
}

function PublicPanel({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-panel", className)} {...props} />;
}

function PublicStat({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="pb-public-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PublicReadOnlyField({
  hint,
  label,
  onCopy,
  tooltip,
  value
}: {
  hint: string;
  label: string;
  onCopy: () => void;
  tooltip: string;
  value: string;
}) {
  return (
    <div className="pb-public-readonly-field">
      <div className="pb-public-readonly-field__header">
        <span className="pb-public-readonly-field__label">{label}</span>
        <button
          aria-label={`Copy ${label.toLowerCase()}`}
          className="pb-public-copy-button"
          onClick={onCopy}
          type="button"
        >
          <svg aria-hidden="true" className="pb-public-copy-button__icon" viewBox="0 0 20 20">
            <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v8A2.5 2.5 0 0 0 7 16.5h7A2.5 2.5 0 0 0 16.5 14V6A2.5 2.5 0 0 0 14 3.5H7Z" />
            <path d="M4.5 12.5h-1A2.5 2.5 0 0 1 1 10V4A2.5 2.5 0 0 1 3.5 1.5h7A2.5 2.5 0 0 1 13 4v1" />
          </svg>
          <span className="pb-public-copy-button__tooltip">{tooltip}</span>
        </button>
      </div>
      <div className="pb-public-readonly-field__control">
        <input className="font-mono" readOnly type="text" value={value} />
      </div>
      <p className="pb-public-readonly-field__hint">{hint}</p>
    </div>
  );
}

function PublicShellLink({
  className,
  to,
  children
}: {
  className?: string;
  to: string;
  children: string;
}) {
  return (
    <NavLink className={cn("pb-public-button-link", className)} to={to}>
      {children}
    </NavLink>
  );
}

function RootHostErrorNotice({ error }: { error: RootHostErrorViewModel | null }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyFailedField, setCopyFailedField] = useState<string | null>(null);

  useEffect(() => {
    if (copiedField === null && copyFailedField === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedField(null);
      setCopyFailedField(null);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedField, copyFailedField]);

  if (error === null) {
    return null;
  }

  async function copyValue(fieldKey: string, value: string) {
    const copied = await writeClipboardValue(value);
    setCopiedField(copied ? fieldKey : null);
    setCopyFailedField(copied ? null : fieldKey);
  }

  function resolveTooltip(fieldKey: string): string {
    if (copiedField === fieldKey) {
      return "Copied";
    }

    if (copyFailedField === fieldKey) {
      return "Copy unavailable";
    }

    return "Copy to clipboard";
  }

  return (
    <Alert variant="danger">
      <AlertTitle>{error.title}</AlertTitle>
      <AlertBody>{error.detail}</AlertBody>
      {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
      {error.correlationId ? (
        <AlertBody>
          <span>Correlation id:</span>
          <span className="mt-2 inline-flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em]">{error.correlationId}</span>
            <button
              aria-label="Copy correlation id"
              className="pb-public-copy-button pb-public-copy-button--inline"
              onClick={() => {
                void copyValue("correlation-id", error.correlationId!);
              }}
              type="button"
            >
              <svg aria-hidden="true" className="pb-public-copy-button__icon" viewBox="0 0 20 20">
                <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v8A2.5 2.5 0 0 0 7 16.5h7A2.5 2.5 0 0 0 16.5 14V6A2.5 2.5 0 0 0 14 3.5H7Z" />
                <path d="M4.5 12.5h-1A2.5 2.5 0 0 1 1 10V4A2.5 2.5 0 0 1 3.5 1.5h7A2.5 2.5 0 0 1 13 4v1" />
              </svg>
              <span className="pb-public-copy-button__tooltip">{resolveTooltip("correlation-id")}</span>
            </button>
          </span>
        </AlertBody>
      ) : null}
    </Alert>
  );
}

function PublicTopbar({ hostContext }: { hostContext: RootHostContext }) {
  return (
    <header className="pb-public-topbar">
      <NavLink aria-label="PaperBinder home" className="pb-public-brand" to="/">
        <img
          alt=""
          aria-hidden="true"
          className="pb-public-brand-image"
          src="/brand/pb-full-logo-white.png"
        />
      </NavLink>

      <nav aria-label="Primary navigation" className="pb-public-topnav">
        {rootRouteDefinitions.map((route) => (
          <NavLink
            className={({ isActive }) => cn("pb-public-topnav-link", isActive && "pb-public-topnav-link--active")}
            end={route.path === "/"}
            key={route.path}
            to={route.path}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>

      <div className="pb-public-topbar-actions">
        {hostContext.debugAlias ? (
          <span className="pb-public-debug-chip">Loopback alias</span>
        ) : null}
        <PublicShellLink className="pb-public-header-cta" to="/start-demo">
          Start Demo
        </PublicShellLink>
      </div>
    </header>
  );
}

function RootShell({ hostContext }: { hostContext: RootHostContext }) {
  const location = useLocation();
  const isLandingRoute = location.pathname === "/";

  return (
    <div className="pb-public-site">
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--ring" />
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--glow" />

      <PublicTopbar hostContext={hostContext} />

      <main className={cn("pb-public-main", isLandingRoute ? "pb-public-main--landing" : "pb-public-main--inner")}>
        <Outlet />
      </main>

      <footer className="pb-public-footer">
        <span>&copy; 2026 PaperBinder</span>
        <span>{hostContext.currentOrigin}</span>
      </footer>
    </div>
  );
}

function RootLandingPage() {
  return (
    <div className="pb-public-landing">
      <section className="pb-public-hero">
        <section aria-labelledby="public-hero-title" className="pb-public-hero-copy">
          <p className="pb-public-eyebrow">PaperBinder</p>
          <h1 id="public-hero-title">A secure workspace for your documents and your team.</h1>
          <p className="pb-public-hero-body">
            Multi-tenant by design. Review the product in a temporary workspace that stays product-first from the first click.
          </p>
          <div className="pb-public-hero-actions">
            <PublicShellLink className="pb-public-button-link--light" to="/start-demo">
              Start live demo
            </PublicShellLink>
            <PublicShellLink className="pb-public-button-link--ghost" to="/about">
              Learn more
            </PublicShellLink>
          </div>
        </section>

        <section aria-label="PaperBinder product preview" className="pb-public-product-mockup">
          <div className="pb-public-mockup-stage">
            <div className="pb-public-mockup-frame">
              <div aria-hidden="true" className="pb-public-browser-chrome">
                <span className="pb-public-dot pb-public-dot--red" />
                <span className="pb-public-dot pb-public-dot--yellow" />
                <span className="pb-public-dot pb-public-dot--green" />
              </div>
              <div className="pb-public-proof-window">
                <img
                  alt="PaperBinder dashboard showing lease metrics, recent binders, and next actions inside the authenticated workspace."
                  className="pb-public-proof-image pb-public-proof-image--hero"
                  src="/presentation/dashboard-proof.png"
                />
              </div>
            </div>
            <div className="pb-public-phone-preview">
              <div aria-hidden="true" className="pb-public-phone-preview__speaker" />
              <div className="pb-public-phone-preview__screen">
                <img
                  alt="PaperBinder start-demo flow shown in a handheld preview with one-time credentials and the live workspace handoff."
                  className="pb-public-proof-image pb-public-proof-image--phone"
                  src="/presentation/start-demo-proof.png"
                />
              </div>
            </div>
          </div>
        </section>
      </section>

      <section aria-label="PaperBinder value pillars" className="pb-public-feature-strip">
        {publicValuePillars.map((pillar) => (
          <article className="pb-public-feature" key={pillar.title}>
            <div aria-hidden="true" className="pb-public-feature-icon" />
            <div>
              <h2>{pillar.title}</h2>
              <p>{pillar.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="pb-public-secondary-grid">
        <PublicPanel className="pb-public-panel--soft pb-public-panel--proof">
          <p className="pb-public-panel-eyebrow">Users and access</p>
          <h2>Admin actions stay on the workspace route.</h2>
          <p>
            Tenant admins add users, adjust roles, and start view-as from one product surface without leaving
            the workspace context.
          </p>
          <div className="pb-public-proof-card">
            <img
              alt="PaperBinder users and access page showing current users, add-user form, role management, and view-as actions."
              className="pb-public-proof-image pb-public-proof-image--supporting"
              src="/presentation/users-proof.png"
            />
          </div>
        </PublicPanel>

        <PublicPanel className="pb-public-panel--soft">
          <p className="pb-public-panel-eyebrow">Product-first public path</p>
          <h2>Start with the software, not the setup mechanics.</h2>
          <p>
            The public experience leads with the product itself. Demo provisioning, challenge verification,
            one-time credentials, and redirect-safe sign in stay behind the entry flow instead of crowding the
            landing page.
          </p>
        </PublicPanel>
      </section>
    </div>
  );
}

function ProvisionSuccessPanel({
  provisionedTenant,
  onContinue
}: {
  provisionedTenant: ProvisionResponse;
  onContinue: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyFailedField, setCopyFailedField] = useState<string | null>(null);

  useEffect(() => {
    if (copiedField === null && copyFailedField === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedField(null);
      setCopyFailedField(null);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedField, copyFailedField]);

  async function copyValue(fieldKey: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setCopyFailedField(null);
    } catch {
      setCopiedField(null);
      setCopyFailedField(fieldKey);
    }
  }

  function resolveTooltip(fieldKey: string): string {
    if (copiedField === fieldKey) {
      return "Copied";
    }

    if (copyFailedField === fieldKey) {
      return "Copy unavailable";
    }

    return "Copy to clipboard";
  }

  return (
    <PublicPanel className="pb-public-panel--form">
      <div className="pb-public-panel-heading">
        <p className="pb-public-panel-eyebrow">Workspace ready</p>
        <h2>Workspace ready.</h2>
        <p>
          PaperBinder already established the signed-in session. These one-time credentials appear only during
          this handoff and are not written into browser storage.
        </p>
      </div>

      <Alert variant="warning">
        <AlertTitle>Save these credentials now</AlertTitle>
        <AlertBody>Save the generated email and password before you continue. This is the only time they are shown.</AlertBody>
      </Alert>

      <dl className="pb-public-stat-grid">
        <PublicStat
          label="Tenant slug"
          value={
            <span className="pb-public-stat-copy">
              <span>{provisionedTenant.tenantSlug}</span>
              <button
                aria-label="Copy tenant slug"
                className="pb-public-copy-button pb-public-copy-button--inline"
                onClick={() => {
                  void copyValue("tenant-slug", provisionedTenant.tenantSlug);
                }}
                type="button"
              >
                <svg aria-hidden="true" className="pb-public-copy-button__icon" viewBox="0 0 20 20">
                  <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v8A2.5 2.5 0 0 0 7 16.5h7A2.5 2.5 0 0 0 16.5 14V6A2.5 2.5 0 0 0 14 3.5H7Z" />
                  <path d="M4.5 12.5h-1A2.5 2.5 0 0 1 1 10V4A2.5 2.5 0 0 1 3.5 1.5h7A2.5 2.5 0 0 1 13 4v1" />
                </svg>
                <span className="pb-public-copy-button__tooltip">{resolveTooltip("tenant-slug")}</span>
              </button>
            </span>
          }
        />
        <PublicStat label="Lease expires" value={formatDateTime(provisionedTenant.expiresAt)} />
        <PublicStat label="Workspace route" value="/app" />
      </dl>

      <div className="pb-public-form-stack">
        <PublicReadOnlyField
          hint="Generated for this disposable workspace."
          label="Email"
          onCopy={() => {
            void copyValue("email", provisionedTenant.credentials.email);
          }}
          tooltip={resolveTooltip("email")}
          value={provisionedTenant.credentials.email}
        />
        <PublicReadOnlyField
          hint="Shown once during this root-host handoff."
          label="Password"
          onCopy={() => {
            void copyValue("password", provisionedTenant.credentials.password);
          }}
          tooltip={resolveTooltip("password")}
          value={provisionedTenant.credentials.password}
        />
      </div>

      <div className="pb-public-action-row">
        <Button onClick={onContinue} type="button">
          Open workspace
        </Button>
        <Button asChild type="button" variant="secondary">
          <NavLink to="/login">Go to sign in</NavLink>
        </Button>
      </div>
    </PublicPanel>
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
    <div className="pb-public-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">Start demo</p>
        <h1>Start a live demo workspace</h1>
        <p>
          Start a temporary PaperBinder workspace, receive one-time credentials, and continue directly into the
          live product.
        </p>
      </section>

      <div className="pb-public-page-grid">
        {provisionedTenant ? (
          <ProvisionSuccessPanel onContinue={handleContinueToTenant} provisionedTenant={provisionedTenant} />
        ) : (
          <PublicPanel className="pb-public-panel--form">
            <div className="pb-public-panel-heading">
              <p className="pb-public-panel-eyebrow">New demo workspace</p>
              <h2>Provision a temporary tenant and keep the server in charge.</h2>
              <p>
                Choose a workspace name and let the root host verify the challenge, create the demo tenant, and
                return the approved destination.
              </p>
            </div>

            <form className="pb-public-form-stack" onSubmit={handleProvisionSubmit}>
              <Field
                error={fieldErrors.tenantName}
                hint="PaperBinder normalizes the workspace name on the server before opening the demo."
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
                  <AlertBody>Challenge verification is bypassed for this local demo runtime.</AlertBody>
                </Alert>
              ) : (
                <RootHostChallengeWidget
                  error={fieldErrors.challenge}
                  hint="Complete the challenge before PaperBinder accepts a provisioning or sign-in request."
                  label="Challenge"
                  onTokenChange={setChallengeToken}
                  resetNonce={challengeResetNonce}
                  scriptUrl={hostContext.environment.challengeScriptUrl}
                  siteKey={hostContext.environment.challengeSiteKey}
                />
              )}

              <RootHostErrorNotice error={error} />

              <div className="pb-public-action-row">
                <Button isLoading={isSubmitting} type="submit">
                  Start demo workspace
                </Button>
                <Button asChild type="button" variant="secondary">
                  <NavLink to="/login">Go to sign in</NavLink>
                </Button>
              </div>
            </form>
          </PublicPanel>
        )}

        <div className="pb-public-side-stack">
          <PublicPanel>
            <p className="pb-public-panel-eyebrow">Use existing credentials</p>
            <h2>Return to a provisioned workspace.</h2>
            <p>
              Root-host sign in remains available for return visits and still relies on the same
              server-approved destination.
            </p>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/login">Go to sign in</NavLink>
              </Button>
            </div>
          </PublicPanel>

          <PublicPanel>
            <p className="pb-public-panel-eyebrow">What stays true</p>
            <ul className="pb-public-bullet-list">
              <li>Provisioning sends only workspace name plus challenge proof through the SPA client.</li>
              <li>Generated credentials remain transient in memory only and are never written into browser storage.</li>
              <li>Redirect navigation uses only the absolute `redirectUrl` returned by the server.</li>
              <li>Failures stay limited to challenge, credential, rate-limit, and expiry guidance.</li>
              <li>Demo workspaces are temporary and removed during periodic cleanup.</li>
            </ul>
          </PublicPanel>
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
    <div className="pb-public-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">Direct sign in</p>
        <h1>Sign in to a demo workspace</h1>
        <p>
          Return to a previously provisioned workspace with valid credentials. Redirect resolution stays on the
          server so the browser never builds tenant URLs from user input.
        </p>
      </section>

      <div className="pb-public-page-grid">
        <PublicPanel className="pb-public-panel--form">
          <div className="pb-public-panel-heading">
            <p className="pb-public-panel-eyebrow">Root-host login</p>
            <h2>Use existing demo credentials.</h2>
            <p>Valid credentials continue through the server-approved destination into the tenant host.</p>
          </div>

          <form className="pb-public-form-stack" onSubmit={handleLoginSubmit}>
            <Field error={fieldErrors.email} hint="Use the email issued for this demo workspace." label="Email">
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
                <AlertBody>Challenge verification is bypassed for this local demo runtime.</AlertBody>
              </Alert>
            ) : (
              <RootHostChallengeWidget
                error={fieldErrors.challenge}
                hint="Complete the challenge before PaperBinder accepts a root-host sign-in request."
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
                <AlertBody>The browser is continuing with the server-approved destination.</AlertBody>
              </Alert>
            ) : null}

            <div className="pb-public-action-row">
              <Button isLoading={isSubmitting} type="submit">
                Log in
              </Button>
              <Button asChild type="button" variant="secondary">
                <NavLink to="/start-demo">Back to start demo</NavLink>
              </Button>
            </div>
          </form>

          {redirect ? (
            <div className="pb-public-action-row">
              <Button onClick={handleContinueManually} type="button" variant="secondary">
                Continue manually
              </Button>
            </div>
          ) : null}
        </PublicPanel>

        <div className="pb-public-side-stack">
          <PublicPanel>
            <p className="pb-public-panel-eyebrow">Prefer the product-led path?</p>
            <h2>Start with a fresh demo workspace.</h2>
            <p>
              The default public flow creates a temporary demo tenant, hands off one-time credentials, and then
              sends you into the live product.
            </p>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/start-demo">Start demo instead</NavLink>
              </Button>
            </div>
          </PublicPanel>

          <PublicPanel>
            <p className="pb-public-panel-eyebrow">Security posture</p>
            <ul className="pb-public-bullet-list">
              <li>Challenge proof is required before login requests are accepted unless local bypass is enabled.</li>
              <li>Retryable failures reset the challenge requirement rather than reusing stale proof.</li>
              <li>The client consumes only the absolute redirect target returned by the server.</li>
            </ul>
          </PublicPanel>
        </div>
      </div>
    </div>
  );
}

function RootAboutPage() {
  return (
    <div className="pb-public-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">About this demo</p>
        <h1>PaperBinder is a constrained multi-tenant document workspace.</h1>
        <p>
          It is intentionally narrow in scope: enough product surface to feel real, enough architecture to
          review, and explicit boundaries around what it is not trying to become.
        </p>
      </section>

      <div className="pb-public-secondary-grid">
        <PublicPanel>
          <p className="pb-public-panel-eyebrow">Core product truth</p>
          <h2>Binders, immutable documents, and role-aware access.</h2>
          <dl className="pb-public-stat-grid">
            <PublicStat label="Core objects" value="Binders and immutable text documents" />
            <PublicStat label="Access model" value="Role-aware and tenant-isolated" />
            <PublicStat label="Live demo path" value="Product first, then disposable workspace entry" />
          </dl>
        </PublicPanel>

        <PublicPanel>
          <p className="pb-public-panel-eyebrow">Intentional constraints</p>
          <h2>This demo favors clarity over breadth.</h2>
          <ul className="pb-public-bullet-list">
            <li>It is a hiring artifact and architecture demonstration, not a broad enterprise suite.</li>
            <li>Tenant isolation, redirect trust, and server-authoritative auth boundaries remain non-negotiable.</li>
            <li>Reviewer-facing context stays available without displacing the product story from the landing page.</li>
            <li>Demo tenants are temporary and may be removed during routine cleanup.</li>
          </ul>
        </PublicPanel>
      </div>
    </div>
  );
}

function RootNotFoundPage() {
  return (
    <div className="pb-public-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">Page unavailable</p>
        <h1>This page is not part of the PaperBinder public site.</h1>
        <p>Unknown routes stay on the root host instead of guessing tenant identity or crossing into workspace routes.</p>
      </section>

      <PublicPanel>
        <p className="pb-public-panel-eyebrow">Start from a known route</p>
        <ul className="pb-public-bullet-list">
          <li>
            <code>/</code> for the product-led public landing page
          </li>
          <li>
            <code>/start-demo</code> for provisioning and one-time credential handoff
          </li>
          <li>
            <code>/login</code> for direct sign in with existing demo credentials
          </li>
          <li>
            <code>/about</code> for scope and supporting context
          </li>
        </ul>
      </PublicPanel>
    </div>
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
