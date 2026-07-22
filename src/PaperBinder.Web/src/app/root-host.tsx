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
    body: "Assigned roles control what each user can see and do."
  },
  {
    icon: "document",
    title: "Immutable documents",
    body: "Documents are reviewable records, not freeform editor content."
  },
  {
    icon: "timer",
    title: "Temporary demo lifecycle",
    body: "Demo workspaces expire automatically."
  }
];

const publicDemoSteps: PublicDemoStep[] = [
  {
    title: "Create a temporary workspace",
    body: "Choose a workspace name and complete the security challenge."
  },
  {
    title: "Save the generated credentials",
    body: "Credentials are shown before entering the workspace."
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

function PublicPage({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("pb-public-page", className)} {...props} />;
}

function PublicHero({
  eyebrow,
  title,
  children,
  actions,
  id,
  variant = "page"
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  id?: string;
  variant?: "landing" | "page";
}) {
  const titleId = id ?? "public-page-title";

  return (
    <section
      aria-labelledby={titleId}
      className={cn(variant === "landing" ? "pb-public-hero-copy" : "pb-public-page-intro")}
    >
      <p className="pb-public-eyebrow">{eyebrow}</p>
      <h1 id={titleId}>{title}</h1>
      {variant === "landing" ? <p className="pb-public-hero-body">{children}</p> : <p>{children}</p>}
      {actions ? <div className="pb-public-hero-actions">{actions}</div> : null}
    </section>
  );
}

function PublicPanel({
  className,
  variant = "default",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  variant?: "default" | "form" | "soft";
}) {
  return (
    <section
      className={cn(
        "pb-public-panel",
        variant === "form" && "pb-public-panel--form",
        variant === "soft" && "pb-public-panel--soft",
        className
      )}
      {...props}
    />
  );
}

function PublicFormPanel({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <PublicPanel className={cn("pb-public-form-panel", className)} variant="form" {...props} />;
}

function GlassPanel({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-glass-panel", className)} {...props} />;
}

function GlassPanelSection({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={cn("pb-public-glass-panel-section", className)} {...props} />;
}

function PublicPanelHeading({
  eyebrow,
  title,
  children,
  className,
  titleId
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  className?: string;
  titleId?: string;
}) {
  const heading = titleId ? <h2 id={titleId}>{title}</h2> : <h2>{title}</h2>;

  return (
    <div className={cn("pb-public-panel-heading", className)}>
      <p className="pb-public-panel-eyebrow">{eyebrow}</p>
      {heading}
      {children ? <p>{children}</p> : null}
    </div>
  );
}

function PublicStorySection({
  className,
  variant = "default",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  variant?: "default" | "accent" | "split";
}) {
  return (
    <section
      className={cn(
        "pb-public-story-section",
        variant === "accent" && "pb-public-story-section--accent",
        variant === "split" && "pb-public-story-section--split",
        className
      )}
      {...props}
    />
  );
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

function FeatureCard({ pillar }: { pillar: PublicValuePillar }) {
  return (
    <article className="pb-public-feature">
      <PublicProofIcon icon={pillar.icon} />
      <div>
        <h2>{pillar.title}</h2>
        <p>{pillar.body}</p>
      </div>
    </article>
  );
}

function ArticleCard({
  meta,
  title,
  children,
  href,
  cta
}: {
  meta: string;
  title: string;
  children: ReactNode;
  href: string;
  cta: string;
}) {
  return (
    <article className="pb-public-about-article-card">
      <div>
        <p className="pb-public-about-article-meta">{meta}</p>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
      <a href={href} onClick={href === "#" ? (event) => event.preventDefault() : undefined}>
        {cta}
      </a>
    </article>
  );
}

function ProofCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li>
      <h3>{title}</h3>
      <p>{children}</p>
    </li>
  );
}

function ReferenceCard({
  title,
  href,
  label,
  children
}: {
  title: string;
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <li>
      <h3>{title}</h3>
      <a href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
      <p>{children}</p>
    </li>
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

function PublicHeader({ hostContext }: { hostContext: RootHostContext }) {
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
          <a className="pb-public-button-link pb-public-header-cta" href={workspaceReturnUrl}>
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

function PublicFooter() {
  return (
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
        <a className="pb-public-footer-link" href={productIdentity.authorUrl} rel="noreferrer" target="_blank">
          {productIdentity.authorName}
        </a>
      </div>
    </footer>
  );
}

function PublicShell({ hostContext }: { hostContext: RootHostContext }) {
  const location = useLocation();
  const isLandingRoute = location.pathname === "/";

  useEffect(() => {
    setDocumentTitle(resolveRootPageTitle(location.pathname));
  }, [location.pathname]);

  return (
    <div className="pb-public-site">
      <a className="pb-public-skip-link" href="#public-main">
        Skip to content
      </a>
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--ring" />
      <div aria-hidden="true" className="pb-public-decor pb-public-decor--glow" />

      <PublicHeader hostContext={hostContext} />

      <main
        className={cn("pb-public-main", isLandingRoute ? "pb-public-main--landing" : "pb-public-main--inner")}
        id="public-main"
      >
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

function RootLandingPage({ hostContext }: { hostContext: RootHostContext }) {
  const location = useLocation();
  const workspaceReturnUrl = resolveWorkspaceReturnUrl(location.search, hostContext.environment);

  return (
    <div className="pb-public-landing">
      <section className="pb-public-hero">
        <PublicHero
          actions={
            <>
              {workspaceReturnUrl ? (
                <a className="pb-public-button-link pb-public-button-link--light" href={workspaceReturnUrl}>
                  Open workspace
                </a>
              ) : (
                <PublicShellLink className="pb-public-button-link--light" to="/start-demo">
                  Start demo
                </PublicShellLink>
              )}
              <PublicShellLink className="pb-public-button-link--ghost" to="/about">
                Learn more
              </PublicShellLink>
            </>
          }
          eyebrow="PaperBinder"
          id="public-hero-title"
          title="A production-shaped SaaS demo for document workspaces."
          variant="landing"
        >
          PaperBinder demonstrates tenant isolation, role-aware access, immutable documents, and an ephemeral
          workspace lifecycle in a working product UI.
        </PublicHero>

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
          <FeatureCard key={pillar.title} pillar={pillar} />
        ))}
      </section>

      <div className="pb-public-story-stack">
        <PublicStorySection variant="split">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">USERS AND ACCESS</p>
            <h2>Manage access without leaving the workspace.</h2>
            <p>
              Workspace admins can view users, adjust roles, and issue generated credentials from one route.
            </p>
            <ul className="pb-public-bullet-list">
              <li>Owner and access context stay visible while moving through the workspace.</li>
              <li>User creation and credential generation happen in one flow.</li>
              <li>Role changes and view-as checks stay close to the workspace.</li>
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

        <PublicStorySection variant="accent">
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
    <PublicFormPanel>
      <PublicPanelHeading eyebrow="Workspace ready" title="Workspace ready.">
          You are already signed in to this workspace. Save these credentials now if you want to return to it
          later.
      </PublicPanelHeading>

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
    </PublicFormPanel>
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
      nextFieldErrors.challenge = "Complete the security challenge before starting a workspace.";
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
    <PublicPage className="pb-public-demo-page">
      <PublicHero eyebrow="Start demo" title="Start demo">
        Create a temporary PaperBinder workspace and continue with generated credentials.
      </PublicHero>

      <div className="pb-public-page-grid pb-public-demo-page-grid">
        {provisionedTenant ? (
          <ProvisionSuccessPanel onContinue={handleContinueToTenant} provisionedTenant={provisionedTenant} />
        ) : (
          <PublicFormPanel className="pb-public-panel--demo-form">
            <PublicPanelHeading eyebrow="New demo workspace" title="Create a temporary workspace.">
                Choose a workspace name. PaperBinder verifies the challenge, creates the workspace, and signs
                you in.
            </PublicPanelHeading>

            <form className="pb-public-form-stack" onSubmit={handleProvisionSubmit}>
              <Field
                error={fieldErrors.tenantName}
                hint="This name is used only for the temporary demo workspace."
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
                  hint="Complete the security challenge before starting a workspace."
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
          </PublicFormPanel>
        )}

        <GlassPanel className="pb-public-demo-support">
          <GlassPanelSection>
            <PublicPanelHeading eyebrow="USE EXISTING CREDENTIALS" title="Already have demo credentials?">
              Return to a workspace you already created with the email and password issued during setup.
            </PublicPanelHeading>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/login">Go to sign in</NavLink>
              </Button>
            </div>
          </GlassPanelSection>

          <GlassPanelSection>
            <p className="pb-public-panel-eyebrow">WHAT HAPPENS NEXT</p>
            <ul className="pb-public-bullet-list pb-public-demo-checklist">
              <li>Only the workspace name and security challenge are submitted here.</li>
              <li>Generated credentials are shown before entering the workspace.</li>
              <li>PaperBinder opens the new workspace after setup completes.</li>
              <li>Demo workspaces are temporary and removed during cleanup.</li>
            </ul>
          </GlassPanelSection>
        </GlassPanel>
      </div>
    </PublicPage>
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
      nextFieldErrors.challenge = "Complete the security challenge before signing in.";
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
    <PublicPage className="pb-public-login-page">
      <PublicHero eyebrow="Direct sign in" title="Sign in">
        Return to an existing demo workspace with the credentials generated during setup.
      </PublicHero>

      <div className="pb-public-page-grid pb-public-login-page-grid">
        <PublicFormPanel className="pb-public-panel--login-form">
          <PublicPanelHeading eyebrow="Workspace sign in" title="Use existing demo credentials.">
            Enter the email and password from your workspace setup.
          </PublicPanelHeading>

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
                hint="Complete the security challenge before signing in."
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
        </PublicFormPanel>

        <GlassPanel className="pb-public-login-support">
          <GlassPanelSection>
            <PublicPanelHeading eyebrow="NEED A NEW WORKSPACE?" title="Start with a fresh demo workspace.">
              Create a temporary workspace and continue with generated credentials.
            </PublicPanelHeading>
            <div className="pb-public-action-row">
              <Button asChild type="button" variant="secondary">
                <NavLink to="/start-demo">Start demo instead</NavLink>
              </Button>
            </div>
          </GlassPanelSection>

          <GlassPanelSection>
            <p className="pb-public-panel-eyebrow">HOW SIGN-IN WORKS</p>
            <ul className="pb-public-bullet-list pb-public-login-checklist">
              <li>Complete the security challenge before signing in.</li>
              <li>If sign-in fails, complete the challenge again before retrying.</li>
              <li>After sign-in, PaperBinder sends you to the matching workspace.</li>
            </ul>
          </GlassPanelSection>
        </GlassPanel>
      </div>
    </PublicPage>
  );
}

function RootAboutPage() {
  return (
    <PublicPage className="pb-public-about-page">
      <PublicHero eyebrow="ABOUT PAPERBINDER" title="About PaperBinder">
        A concise overview of what PaperBinder demonstrates, what it intentionally excludes, and where to inspect the
        live project.
      </PublicHero>

      <div className="pb-public-story-stack">
        <PublicStorySection className="pb-public-about-overview" variant="accent">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">ABOUT PAPERBINDER</p>
            <h2>A small, complete SaaS demo for document workspaces.</h2>
            <p>
              PaperBinder includes tenant-scoped workspaces, binder-level access, immutable text documents, and
              temporary demo workspaces with generated credentials.
            </p>
          </div>
          <dl className="pb-public-about-summary-grid">
            <PublicStat label="Core model" value="Binders and immutable text documents." />
            <PublicStat label="Access boundary" value="Role-aware access inside isolated workspaces." />
            <PublicStat label="Review path" value="Temporary demo workspaces with generated credentials." />
          </dl>
        </PublicStorySection>

        <PublicStorySection>
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">WHAT THIS DEMONSTRATES</p>
            <h2>A narrow product scope with real SaaS boundaries.</h2>
          </div>
          <ul className="pb-public-about-card-grid">
            <ProofCard title="Tenant-scoped workspaces">Each demo workspace stays isolated from the others.</ProofCard>
            <ProofCard title="Binder-level access">
              Users can be assigned roles that affect what they can see and do.
            </ProofCard>
            <ProofCard title="Immutable documents">
              Documents are treated as reviewable records rather than freeform editor content.
            </ProofCard>
            <ProofCard title="Temporary demo lifecycle">
              Temporary tenants, expiry state, and cleanup behavior are part of the demo flow.
            </ProofCard>
          </ul>
        </PublicStorySection>

        <PublicStorySection className="pb-public-about-scope-section">
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">INTENTIONAL SCOPE</p>
            <h2>Small by design.</h2>
            <p>
              PaperBinder is intentionally narrow. It demonstrates SaaS architecture, access boundaries, document
              workflows, and deployment quality without expanding into a full document-management platform.
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
                <li>Reviewer-friendly demo path</li>
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
              Deeper notes on the product architecture, tradeoffs, and implementation choices behind PaperBinder.
            </p>
          </div>
          <ArticleCard
            cta="Read article"
            href="#"
            meta="Architecture / SaaS demo"
            title="How I Built a Production-Shaped SaaS Demo with AI Agents"
          >
            A walkthrough of the product architecture, tradeoffs, and implementation choices behind PaperBinder.
          </ArticleCard>
        </PublicStorySection>

        <PublicStorySection>
          <div className="pb-public-story-copy">
            <p className="pb-public-panel-eyebrow">REVIEWER REFERENCES</p>
            <h2>Project links for review.</h2>
            <p>Use these links to inspect the live project, portfolio context, and source history.</p>
          </div>
          <ul className="pb-public-about-reference-list">
            <ReferenceCard
              href={productIdentity.canonicalDemoUrl}
              label={productIdentity.canonicalDemoHost}
              title="Live project"
            >
              Public demo entry point and product walkthrough.
            </ReferenceCard>
            <ReferenceCard href={productIdentity.authorUrl} label="danielmaratta.com" title="Portfolio">
              Main portfolio and professional context.
            </ReferenceCard>
            <ReferenceCard
              href={productIdentity.canonicalRepositoryUrl}
              label="Canonical repository history"
              title="Repository history"
            >
              Source history and implementation record.
            </ReferenceCard>
          </ul>
        </PublicStorySection>
      </div>
    </PublicPage>
  );
}

function RootNotFoundPage() {
  return (
    <PublicPage>
      <PublicHero eyebrow="Page unavailable" title="Page unavailable">
        Use one of the known public pages below.
      </PublicHero>

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
    </PublicPage>
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
      <Route element={<PublicShell hostContext={hostContext} />}>
        <Route element={<RootLandingPage hostContext={hostContext} />} path="/" />
        <Route element={<RootWelcomePage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/start-demo" />
        <Route element={<RootLoginPage apiClient={apiClient} hostContext={hostContext} navigator={navigator} />} path="/login" />
        <Route element={<RootAboutPage />} path="/about" />
        <Route element={<RootNotFoundPage />} path="*" />
      </Route>
    </Fragment>
  );
}
