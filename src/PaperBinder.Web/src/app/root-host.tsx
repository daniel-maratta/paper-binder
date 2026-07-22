import { Fragment, type ComponentPropsWithoutRef, type FormEvent, type ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, Route, useLocation } from "react-router-dom";
import type { LoginResponse, PaperBinderApiClient, ProvisionResponse } from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { cn } from "../lib/cn";
import { RootHostChallengeWidget } from "./challenge-widget";
import { CredentialDisplayField } from "./credential-display-field";
import { productIdentity } from "./product-identity";
import { writeClipboardValue } from "./copy-value-chip";
import type { RootHostContext } from "./host-context";
import type { FrontendEnvironment } from "../environment";
import { rootRouteDefinitions } from "./route-registry";
import { mapRootHostError, type RootHostErrorViewModel } from "./root-host-errors";

type RootHostFieldErrors = Partial<Record<"tenantName" | "email" | "password" | "challenge", string>>;

type PublicValuePillar = {
  icon: "boundary" | "key" | "document" | "timer";
  title: string;
  body: string;
};

type PublicDemoStep = {
  title: string;
  body: string;
};

export type RootHostNavigator = (redirectUrl: string) => void;

const localChallengeBypassToken = "paperbinder-test-challenge-pass";

const publicValuePillars: PublicValuePillar[] = [
  {
    icon: "boundary",
    title: "Tenant isolation",
    body: "Each workspace stays inside its own scoped boundary."
  },
  {
    icon: "key",
    title: "Role-aware access",
    body: "Access changes with each user's assigned role."
  },
  {
    icon: "document",
    title: "Immutable documents",
    body: "Documents are reviewable without becoming a broad editor."
  },
  {
    icon: "timer",
    title: "Temporary demo lifecycle",
    body: "Demo workspaces expire and are removed during cleanup."
  }
];

const publicDemoSteps: PublicDemoStep[] = [
  {
    title: "Create a temporary workspace",
    body: "Choose a workspace name and complete the challenge."
  },
  {
    title: "Save the generated credentials",
    body: "The generated credentials are shown once before entering the workspace."
  },
  {
    title: "Review the live product flows",
    body: "Move through binders, immutable documents, and tenant access from the active workspace."
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

function setDocumentTitle(pageTitle: string) {
  document.title = `${pageTitle} | ${productIdentity.productName}`;
}

function resolveRootPageTitle(pathname: string): string {
  if (pathname === "/login") {
    return "Sign in";
  }

  const matchingRoute = rootRouteDefinitions.find((route) => route.path === pathname);
  if (matchingRoute !== undefined) {
    return matchingRoute.title;
  }

  return "Not found";
}

function resolveWorkspaceReturnUrl(search: string, environment: FrontendEnvironment): string | null {
  const workspaceSlug = new URLSearchParams(search).get("workspace")?.trim().toLowerCase();
  if (!workspaceSlug || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(workspaceSlug)) {
    return null;
  }

  const rootUrl = new URL(environment.rootUrl);
  return `${rootUrl.protocol}//${workspaceSlug}.${environment.tenantBaseDomain}/app`;
}

function PublicPanel({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-panel", className)} {...props} />;
}

function PublicAsideSection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-side-section", className)} {...props} />;
}

function PublicStorySection({
  className,
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-story-section", className)} {...props} />;
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

function PublicProofIcon({ icon }: { icon: PublicValuePillar["icon"] }) {
  if (icon === "boundary") {
    return (
      <svg aria-hidden="true" className="pb-public-feature-icon" viewBox="0 0 24 24">
        <path d="M7 7.5h10v9H7z" />
        <path d="M4.5 4.5h15v15h-15z" />
        <path d="M9.5 12h5" />
      </svg>
    );
  }

  if (icon === "key") {
    return (
      <svg aria-hidden="true" className="pb-public-feature-icon" viewBox="0 0 24 24">
        <path d="M9.5 14.5a4 4 0 1 1 3.3-6.25" />
        <path d="M13 10.5h7" />
        <path d="M17 10.5v3" />
        <path d="M20 10.5v2" />
        <path d="M8.5 11.5h.01" />
      </svg>
    );
  }

  if (icon === "document") {
    return (
      <svg aria-hidden="true" className="pb-public-feature-icon" viewBox="0 0 24 24">
        <path d="M7 3.5h6.5L18 8v12.5H7z" />
        <path d="M13.5 3.5V8H18" />
        <path d="M9.5 14.25 11.25 16l3.5-4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="pb-public-feature-icon" viewBox="0 0 24 24">
      <path d="M12 6.5v5.25l3 1.75" />
      <path d="M7.25 3.75h9.5" />
      <path d="M12 3.75v2.75" />
      <path d="M12 20.5a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </svg>
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
  const location = useLocation();
  const workspaceReturnUrl = resolveWorkspaceReturnUrl(location.search, hostContext.environment);

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
        {workspaceReturnUrl ? (
          <a className="pb-public-header-cta" href={workspaceReturnUrl}>
            Open Workspace
          </a>
        ) : (
          <PublicShellLink className="pb-public-header-cta" to="/start-demo">
            Start Demo
          </PublicShellLink>
        )}
      </div>
    </header>
  );
}

function RootShell({ hostContext }: { hostContext: RootHostContext }) {
  const location = useLocation();
  const isLandingRoute = location.pathname === "/";

  useEffect(() => {
    setDocumentTitle(resolveRootPageTitle(location.pathname));
  }, [location.pathname]);

  return (
    <div className="pb-public-site">
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--ring" />
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--glow" />

      <PublicTopbar hostContext={hostContext} />

      <main className={cn("pb-public-main", isLandingRoute ? "pb-public-main--landing" : "pb-public-main--inner")}>
        <Outlet />
      </main>

      <footer className="pb-public-footer">
        <div className="pb-public-footer-copy">
          <span>&copy; 2026 {productIdentity.productName}</span>
          <span>{productIdentity.provenanceSummary}</span>
        </div>
        <div className="pb-public-footer-links">
          <a
            className="pb-public-footer-link"
            href={productIdentity.canonicalDemoUrl}
            rel="noreferrer"
            target="_blank"
          >
            {productIdentity.canonicalDemoHost}
          </a>
          <a
            className="pb-public-footer-link"
            href={productIdentity.authorUrl}
            rel="noreferrer"
            target="_blank"
          >
            {productIdentity.authorName}
          </a>
        </div>
      </footer>
    </div>
  );
}

function RootLandingPage({ hostContext }: { hostContext: RootHostContext }) {
  const location = useLocation();
  const workspaceReturnUrl = resolveWorkspaceReturnUrl(location.search, hostContext.environment);

  return (
    <div className="pb-public-landing">
      <section className="pb-public-hero">
        <section aria-labelledby="public-hero-title" className="pb-public-hero-copy">
          <p className="pb-public-eyebrow">PaperBinder</p>
          <h1 id="public-hero-title">A secure workspace for your documents and your team.</h1>
          <p className="pb-public-hero-body">
            Start a temporary workspace, move straight into the product, and manage documents with the same flows used inside the app.
          </p>
          <div className="pb-public-hero-actions">
            {workspaceReturnUrl ? (
              <a className="pb-public-button-link--light" href={workspaceReturnUrl}>
                Open workspace
              </a>
            ) : (
              <PublicShellLink className="pb-public-button-link--light" to="/start-demo">
                Start live demo
              </PublicShellLink>
            )}
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
                  alt="PaperBinder dashboard with lease details, recent binders, and next actions."
                  className="pb-public-proof-image pb-public-proof-image--hero"
                  src="/presentation/dashboard-proof.png"
                />
              </div>
            </div>
            <div className="pb-public-phone-preview">
              <div aria-hidden="true" className="pb-public-phone-preview__speaker" />
              <div className="pb-public-phone-preview__screen">
                <img
                  alt="PaperBinder start-demo screen with generated credentials for a new workspace."
                  className="pb-public-proof-image pb-public-proof-image--phone"
                  src="/presentation/start-demo-proof.png"
                />
              </div>
            </div>
          </div>
        </section>
      </section>

      <section aria-label="PaperBinder proof points" className="pb-public-feature-strip">
        {publicValuePillars.map((pillar) => (
          <article className="pb-public-feature" key={pillar.title}>
            <PublicProofIcon icon={pillar.icon} />
            <div>
              <h2>{pillar.title}</h2>
              <p>{pillar.body}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="pb-public-story-stack">
        <PublicStorySection className="pb-public-story-section--split">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">USERS AND ACCESS</p>
            <h2>Manage access without leaving the workspace.</h2>
            <p>
              Workspace admins can keep the full user list in view, adjust roles, and hand off one-time
              credentials from the same route.
            </p>
            <ul className="pb-public-bullet-list">
              <li>Owner and access context stay visible while reviewers move through the workspace.</li>
              <li>User creation and credential handoff happen in one flow.</li>
              <li>Role changes and view-as checks stay close to the product surface.</li>
            </ul>
          </div>
          <div className="pb-public-story-media">
            <div className="pb-public-proof-card">
              <img
                alt="PaperBinder users page with current users, role changes, and view as actions."
                className="pb-public-proof-image pb-public-proof-image--supporting"
                src="/presentation/users-proof.png"
              />
            </div>
          </div>
        </PublicStorySection>

        <PublicStorySection className="pb-public-story-section--accent">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">DEMO PATH</p>
            <h2>Start with the product, not a setup checklist.</h2>
          </div>
          <ol className="pb-public-step-list">
            {publicDemoSteps.map((step, index) => (
              <li className="pb-public-step" key={step.title}>
                <span className="pb-public-step-marker">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </PublicStorySection>
      </div>
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
          You are already signed in to this workspace. Save these credentials now if you want to return to it
          later.
        </p>
      </div>

      <Alert className="mt-4 pt-6" variant="info">
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
        <CredentialDisplayField
          copyButtonLabel="Copy email"
          hint="Use this email if you sign in again later."
          label="Email"
          sensitive={false}
          value={provisionedTenant.credentials.email}
          variant="public"
        />
        <CredentialDisplayField
          copyButtonLabel="Copy password"
          hideButtonLabel="Hide password"
          hint="This password won't be shown again."
          label="Password"
          sensitive
          showButtonLabel="Show password"
          value={provisionedTenant.credentials.password}
          variant="public"
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

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return;
      }

      setProvisionedTenant(null);
      setChallengeToken(null);
      setFieldErrors({});
      setError(null);
      setChallengeResetNonce((value) => value + 1);
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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
    <div className="pb-public-page pb-public-demo-page">
        <section className="pb-public-page-intro">
          <p className="pb-public-eyebrow">Start demo</p>
          <h1>Start demo</h1>
          <p>
            Create a temporary PaperBinder workspace, receive generated credentials, and continue into the
            product.
          </p>
        </section>

      <div className="pb-public-page-grid pb-public-demo-page-grid">
        {provisionedTenant ? (
          <ProvisionSuccessPanel onContinue={handleContinueToTenant} provisionedTenant={provisionedTenant} />
        ) : (
          <PublicPanel className="pb-public-panel--form pb-public-panel--demo-form">
            <div className="pb-public-panel-heading">
              <p className="pb-public-panel-eyebrow">New demo workspace</p>
              <h2>Create a temporary workspace.</h2>
              <p>
                Choose a workspace name. PaperBinder verifies the challenge, creates the workspace, and signs
                you in.
              </p>
            </div>

            <form className="pb-public-form-stack" onSubmit={handleProvisionSubmit}>
              <Field
                error={fieldErrors.tenantName}
                hint="Choose a name for this demo workspace."
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
                  fallbackVariant="panel"
                  hint="Complete the challenge before starting a workspace or signing in."
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

        <div className="pb-public-side-stack pb-public-demo-support">
          <PublicAsideSection>
            <p className="pb-public-panel-eyebrow">USE EXISTING CREDENTIALS</p>
            <h2>Already have demo credentials?</h2>
            <p>
              Return to a workspace you already created with the email and password issued during setup.
            </p>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/login">Go to sign in</NavLink>
              </Button>
            </div>
          </PublicAsideSection>

          <PublicAsideSection>
            <p className="pb-public-panel-eyebrow">WHAT HAPPENS NEXT</p>
            <ul className="pb-public-bullet-list pb-public-demo-checklist">
              <li>Only the workspace name and challenge proof are submitted here.</li>
              <li>Generated credentials are shown once before entering the workspace.</li>
              <li>PaperBinder sends you to the new workspace after it is ready.</li>
              <li>Demo workspaces are temporary and removed during periodic cleanup.</li>
            </ul>
          </PublicAsideSection>
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
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return;
      }

      setPassword("");
      setChallengeToken(null);
      setFieldErrors({});
      setError(null);
      setRedirect(null);
      setChallengeResetNonce((value) => value + 1);
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

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
    <div className="pb-public-page pb-public-login-page">
        <section className="pb-public-page-intro">
          <p className="pb-public-eyebrow">Direct sign in</p>
          <h1>Sign in</h1>
          <p>Return to a workspace you already created with the email and password issued for it.</p>
        </section>

      <div className="pb-public-page-grid pb-public-login-page-grid">
        <PublicPanel className="pb-public-panel--form pb-public-panel--login-form">
          <div className="pb-public-panel-heading">
            <p className="pb-public-panel-eyebrow">Workspace sign in</p>
            <h2>Use existing demo credentials.</h2>
            <p>Enter the email and password from your workspace setup.</p>
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
              hint="Use the password shown when the workspace was created."
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
                fallbackVariant="panel"
                hint="Complete the challenge before signing in."
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
                <AlertTitle>Opening workspace</AlertTitle>
                <AlertBody>Your workspace is opening now.</AlertBody>
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

        <div className="pb-public-side-stack pb-public-login-support">
          <PublicAsideSection>
            <p className="pb-public-panel-eyebrow">NEED A NEW WORKSPACE?</p>
            <h2>Start with a fresh demo workspace.</h2>
            <p>
              Create a temporary workspace and continue into the product with generated credentials.
            </p>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/start-demo">Start demo instead</NavLink>
              </Button>
            </div>
          </PublicAsideSection>

          <PublicAsideSection>
            <p className="pb-public-panel-eyebrow">SECURITY POSTURE</p>
            <ul className="pb-public-bullet-list pb-public-login-checklist">
              <li>Complete the challenge before signing in, unless local bypass is enabled.</li>
              <li>If sign-in fails, complete the challenge again before retrying.</li>
              <li>After sign-in, PaperBinder sends you to the matching workspace.</li>
            </ul>
          </PublicAsideSection>
        </div>
      </div>
    </div>
  );
}

function RootAboutPage() {
  return (
    <div className="pb-public-page pb-public-about-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">ABOUT PAPERBINDER</p>
        <h1>About PaperBinder</h1>
        <p>
          It explains what the project demonstrates, where its boundaries are, and where reviewers can inspect the
          live product and source history.
        </p>
      </section>

      <div className="pb-public-story-stack">
        <PublicStorySection className="pb-public-story-section--accent pb-public-about-overview">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">ABOUT PAPERBINDER</p>
            <h2>A scoped SaaS demo for technical review.</h2>
            <p>
              PaperBinder demonstrates a small but complete document workspace: tenant-scoped workspaces,
              binder-level access, immutable text documents, and a short-lived demo path for reviewers.
            </p>
          </div>
          <dl className="pb-public-about-summary-grid">
            <PublicStat label="Core model" value="Binders and immutable text documents." />
            <PublicStat label="Access boundary" value="Role-aware access inside isolated workspaces." />
            <PublicStat label="Review path" value="Temporary demo workspace with generated credentials." />
          </dl>
        </PublicStorySection>

        <PublicStorySection>
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">WHAT THIS DEMONSTRATES</p>
            <h2>Focused product scope with real SaaS boundaries.</h2>
          </div>
          <ul className="pb-public-about-card-grid">
            <li>
              <h3>Tenant-scoped workspaces</h3>
              <p>Each demo workspace stays isolated from the others.</p>
            </li>
            <li>
              <h3>Binder-level access</h3>
              <p>Users can be assigned roles that affect what they can see and do.</p>
            </li>
            <li>
              <h3>Immutable documents</h3>
              <p>Documents are treated as reviewable records rather than a broad editing surface.</p>
            </li>
            <li>
              <h3>Operational demo lifecycle</h3>
              <p>Temporary tenants, expiry state, and cleanup behavior are part of the product flow.</p>
            </li>
          </ul>
        </PublicStorySection>

        <PublicStorySection className="pb-public-about-scope-section">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">INTENTIONAL SCOPE</p>
            <h2>Small surface area, deliberate boundaries.</h2>
            <p>
              PaperBinder is scoped to demonstrate delivery quality, implementation decisions, and reviewer-visible
              product behavior without pretending to be a full commercial document platform.
            </p>
          </div>
          <div className="pb-public-about-scope-grid">
            <section aria-labelledby="about-in-scope" className="pb-public-about-scope-panel">
              <h3 id="about-in-scope">In scope</h3>
              <ul>
                <li>Temporary demo workspaces</li>
                <li>Tenant isolation</li>
                <li>Binder and document workflows</li>
                <li>Role-aware access</li>
                <li>Reviewer-friendly product path</li>
              </ul>
            </section>
            <section aria-labelledby="about-out-of-scope" className="pb-public-about-scope-panel">
              <h3 id="about-out-of-scope">Out of scope</h3>
              <ul>
                <li>Billing and subscription management</li>
                <li>Broad CMS functionality</li>
                <li>Rich document editing</li>
                <li>Enterprise SSO</li>
                <li>Long-lived customer tenants</li>
              </ul>
            </section>
          </div>
        </PublicStorySection>

        <PublicStorySection className="pb-public-about-articles-section">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">ARTICLES</p>
            <h2>Technical write-ups from the build.</h2>
            <p>
              Deeper notes on the product architecture, implementation tradeoffs, and AI-assisted delivery process
              behind PaperBinder.
            </p>
          </div>
          <article className="pb-public-about-article-card">
            <div>
              <p className="pb-public-about-article-meta">Architecture / AI-assisted development / SaaS demo</p>
              <h3>How I Built a Production-Shaped SaaS Demo with AI Agents</h3>
              <p>
                A walkthrough of the product architecture, implementation choices, reviewer-facing scope, and the
                agent-assisted workflow used to build PaperBinder.
              </p>
            </div>
            <a href="#" onClick={(event) => event.preventDefault()}>
              Read article
            </a>
          </article>
        </PublicStorySection>

        <PublicStorySection>
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">REVIEWER REFERENCES</p>
            <h2>Canonical project references.</h2>
            <p>{productIdentity.provenanceSummary}</p>
          </div>
          <ul className="pb-public-about-reference-list">
            <li>
              <h3>Live project</h3>
              <a href={productIdentity.canonicalDemoUrl} rel="noreferrer" target="_blank">
                {productIdentity.canonicalDemoHost}
              </a>
              <p>Public demo entry point and product walkthrough.</p>
            </li>
            <li>
              <h3>Portfolio</h3>
              <a href={productIdentity.authorUrl} rel="noreferrer" target="_blank">
                danielmaratta.com
              </a>
              <p>Main portfolio and professional context.</p>
            </li>
            <li>
              <h3>Repository history</h3>
              <a href={productIdentity.canonicalRepositoryUrl} rel="noreferrer" target="_blank">
                Canonical repository history
              </a>
              <p>Source history and implementation record.</p>
            </li>
          </ul>
        </PublicStorySection>
      </div>
    </div>
  );
}

function RootNotFoundPage() {
  return (
    <div className="pb-public-page">
      <section className="pb-public-page-intro">
        <p className="pb-public-eyebrow">Page unavailable</p>
        <h1>Page unavailable</h1>
        <p>Use one of the known public pages below.</p>
      </section>

      <PublicPanel>
        <p className="pb-public-panel-eyebrow">Known public pages</p>
        <ul className="pb-public-bullet-list">
          <li>
            <code>/</code> for the product overview
          </li>
          <li>
            <code>/start-demo</code> for creating a demo workspace
          </li>
          <li>
            <code>/login</code> for signing in with existing demo credentials
          </li>
          <li>
            <code>/about</code> for product and scope notes
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
        <Route element={<RootLandingPage hostContext={hostContext} />} path="/" />
        <Route element={<RootWelcomePage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/start-demo" />
        <Route element={<RootLoginPage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/login" />
        <Route element={<RootAboutPage />} path="/about" />
        <Route element={<RootNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
