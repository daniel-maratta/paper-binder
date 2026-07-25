import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import packageJson from "../../package.json";
import {
  PaperBinderApiError,
  type PaperBinderApiClient,
  type TenantImpersonationStatus,
  type TenantLeaseSummary,
  type TenantRole
} from "../api/client";
import { Alert, AlertBody, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { StatusBadge } from "../components/ui/status-badge";
import { Toast, ToastViewport } from "../components/ui/toast";
import { cn } from "../lib/cn";
import { CopyValueChip, writeClipboardValue } from "./copy-value-chip";
import type { TenantHostContext } from "./host-context";
import { productIdentity } from "./product-identity";
import { tenantNavigationItems } from "./route-registry";
import {
  mapTenantHostError,
  type TenantHostErrorViewModel
} from "./tenant-host-errors";
import { TenantLeaseBanner } from "./tenant-lease-banner";

export type TenantShellOutletContext = {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  lease: TenantLeaseSummary;
  countdownSeconds: number;
  impersonation: TenantImpersonationStatus;
  startImpersonation: (userId: string) => Promise<TenantImpersonationStatus>;
  stopImpersonation: () => Promise<TenantImpersonationStatus>;
  showToast: (toast: TenantShellToastInput) => void;
};

type TenantShellToastVariant = "info" | "success" | "warning" | "danger";

export type TenantShellToastInput = {
  title: string;
  body: string;
  variant?: TenantShellToastVariant;
};

type TenantShellToast = TenantShellToastInput & {
  id: string;
  variant: TenantShellToastVariant;
};

type ToastDismissState = {
  timeoutId: number | null;
  remainingMs: number;
  startedAt: number | null;
};

type TenantBootstrapViewModel = {
  title: string;
  detail: string;
  correlationId: string | null;
  retryAfterLabel: string | null;
  showSignInAction: boolean;
};

export const roleOptions: readonly TenantRole[] = ["TenantAdmin", "BinderWrite", "BinderRead"];
const leaseExtensionWindowSeconds = 10 * 60;
const toastAutoDismissMs = 5000;
const desktopShellMediaQuery = "(min-width: 1024px)";

export type TenantHostNavigator = (redirectUrl: string) => void;

export function defaultTenantHostNavigator(redirectUrl: string) {
  window.location.assign(redirectUrl);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) {
    return "Expired";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export function formatRole(role: TenantRole): string {
  switch (role) {
    case "TenantAdmin":
      return "Tenant admin";
    case "BinderWrite":
      return "Binder write";
    case "BinderRead":
      return "Binder read";
    default:
      return role;
  }
}

export function canManageWorkspaceUsers(role: TenantRole): boolean {
  return role === "TenantAdmin";
}

export function hasUsersDashboardAccess(impersonation: TenantImpersonationStatus): boolean {
  return canManageWorkspaceUsers(impersonation.effective.role);
}

function normalizeCountdownSeconds(secondsRemaining: number): number {
  if (!Number.isFinite(secondsRemaining)) {
    return 0;
  }

  return Math.max(0, Math.ceil(secondsRemaining));
}

function toRootLoginUrl(rootUrl: string, tenantSlug?: string): string {
  const url = new URL("/login", rootUrl);
  if (tenantSlug) {
    url.searchParams.set("workspace", tenantSlug);
  }

  return url.toString();
}

function toRootHomeUrl(rootUrl: string, tenantSlug?: string): string {
  const url = new URL("/", rootUrl);
  if (tenantSlug) {
    url.searchParams.set("workspace", tenantSlug);
  }

  return url.toString();
}

function toRootAboutUrl(rootUrl: string, tenantSlug?: string): string {
  const url = new URL("/about", rootUrl);
  if (tenantSlug) {
    url.searchParams.set("workspace", tenantSlug);
  }

  return url.toString();
}

function setDocumentTitle(pageTitle: string) {
  document.title = `${pageTitle} | ${productIdentity.productName}`;
}

function resolveTenantPageTitle(pathname: string): string {
  if (pathname === "/app") {
    return "Dashboard";
  }

  if (pathname === "/app/binders") {
    return "Binders";
  }

  if (pathname.startsWith("/app/binders/")) {
    return "Binder";
  }

  if (pathname.startsWith("/app/documents/")) {
    return "Document";
  }

  if (pathname === "/app/users") {
    return "Users";
  }

  return "Not found";
}

function isToastAutoDismissable(variant: TenantShellToastVariant): boolean {
  return variant === "info" || variant === "success";
}

function isTerminalShellFailure(error: unknown): boolean {
  if (!(error instanceof PaperBinderApiError)) {
    return false;
  }

  return (
    error.errorCode === "AUTHENTICATION_REQUIRED" ||
    error.errorCode === "TENANT_FORBIDDEN" ||
    error.errorCode === "TENANT_EXPIRED" ||
    error.errorCode === "TENANT_NOT_FOUND"
  );
}

function getStringProblemExtension(error: PaperBinderApiError, key: string): string | null {
  const value = error.extensions?.[key];
  return typeof value === "string" ? value : null;
}

function createBootstrapViewModel(error: unknown): TenantBootstrapViewModel {
  if (error instanceof PaperBinderApiError) {
    switch (error.errorCode) {
      case "AUTHENTICATION_REQUIRED":
        return {
          title: "Authentication required",
          detail: error.detail ?? "Sign in again from the main site before returning to this workspace.",
          correlationId: error.correlationId,
          retryAfterLabel: null,
          showSignInAction: true
        };
      case "TENANT_FORBIDDEN":
        return {
          title: "Workspace access denied",
          detail: error.detail ?? "This session is not allowed to open the requested workspace.",
          correlationId: error.correlationId,
          retryAfterLabel: null,
          showSignInAction: false
        };
      case "TENANT_EXPIRED":
        if (getStringProblemExtension(error, "terminalTenantState") === "expired_retained_recent_activity") {
          return {
            title: "Demo expired",
            detail:
              "This demo workspace has expired. PaperBinder is keeping it briefly because there was recent activity, but access is already closed and cleanup will remove it soon.",
            correlationId: error.correlationId,
            retryAfterLabel: null,
            showSignInAction: false
          };
        }

        return {
          title: "Demo expired",
          detail: error.detail ?? "This demo workspace has expired and is no longer available.",
          correlationId: error.correlationId,
          retryAfterLabel: null,
          showSignInAction: false
        };
      case "TENANT_NOT_FOUND":
        return {
          title: "Workspace unavailable",
          detail: error.detail ?? "This workspace is not available from the current address.",
          correlationId: error.correlationId,
          retryAfterLabel: null,
          showSignInAction: false
        };
      default: {
        const mappedError = mapTenantHostError(error);
        return {
          title: error.status === 401 ? "Authentication required" : "Workspace could not be loaded",
          detail: mappedError.detail,
          correlationId: mappedError.correlationId,
          retryAfterLabel: mappedError.retryAfterLabel,
          showSignInAction: error.status === 401
        };
      }
    }
  }

  return {
    title: "Workspace could not be loaded",
    detail: "PaperBinder could not load this workspace. Check your connection and try again in a moment.",
    correlationId: null,
    retryAfterLabel: null,
    showSignInAction: false
  };
}

export function useTenantShellContext() {
  return useOutletContext<TenantShellOutletContext>();
}

function CopyableCorrelationId({
  correlationId
}: {
  correlationId: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleCopy() {
    const copied = await writeClipboardValue(correlationId);
    setCopyState(copied ? "copied" : "unavailable");
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <CopyValueChip
        compact
        label="correlation id"
        onCopy={() => {
          void handleCopy();
        }}
        value={correlationId}
      />
      {copyState === "copied" ? <span className="pb-auth-note">Copied.</span> : null}
      {copyState === "unavailable" ? <span className="pb-auth-note">Clipboard unavailable.</span> : null}
    </div>
  );
}

export function TenantHostErrorNotice({ error }: { error: TenantHostErrorViewModel | null }) {
  if (error === null) {
    return null;
  }

  return (
    <Alert variant="danger">
      <AlertTitle>{error.title}</AlertTitle>
      <AlertBody>{error.detail}</AlertBody>
      {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
      {error.correlationId ? (
        <div className="mt-1.5 text-sm leading-6">
          <span>Correlation id:</span>
          <CopyableCorrelationId correlationId={error.correlationId} />
        </div>
      ) : null}
    </Alert>
  );
}

function TenantBootstrapFailurePage({
  error,
  rootLoginUrl,
  rootHomeUrl
}: {
  error: TenantBootstrapViewModel;
  rootLoginUrl: string;
  rootHomeUrl: string;
}) {
  return (
    <div className="pb-auth-boot">
      <section className="pb-auth-panel pb-auth-boot-card">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Workspace routing</p>
          <h1 className="pb-auth-page-title">{error.title}</h1>
          <p className="pb-auth-panel-copy">
            This workspace address could not be opened, but you can safely return to the public site or sign in again.
          </p>
        </div>
        <div className="pb-auth-panel-body">
          <Alert variant="danger">
            <AlertTitle>Return to a safe starting point</AlertTitle>
            <AlertBody>{error.detail}</AlertBody>
            {error.retryAfterLabel ? <AlertBody>{error.retryAfterLabel}</AlertBody> : null}
            {error.correlationId ? (
              <div className="mt-1.5 text-sm leading-6">
                <span>Correlation id:</span>
                <CopyableCorrelationId correlationId={error.correlationId} />
              </div>
            ) : null}
          </Alert>
        </div>
        <div className="pb-auth-panel-actions">
          <Button asChild type="button">
            <a href={rootHomeUrl}>Return to main site</a>
          </Button>
          {error.showSignInAction ? (
            <Button asChild type="button" variant="secondary">
              <a href={rootLoginUrl}>Return to sign in</a>
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function TenantShellLoadingPage() {
  return (
    <div className="pb-auth-boot">
      <section className="pb-auth-panel pb-auth-boot-card">
        <div className="pb-auth-panel-header">
          <p className="pb-auth-eyebrow">Workspace loading</p>
          <h1 className="pb-auth-page-title">Loading tenant workspace</h1>
          <p className="pb-auth-panel-copy">Loading the current workspace.</p>
        </div>
      </section>
    </div>
  );
}

export function TenantRouteFailureCard({
  error,
  action
}: {
  error: TenantHostErrorViewModel;
  action?: ReactNode;
}) {
  return (
    <section className="pb-auth-panel pb-auth-panel--route">
      <div className="pb-auth-panel-header">
        <p className="pb-auth-eyebrow">Route status</p>
        <h2 className="pb-auth-panel-title pb-auth-panel-title--lg">{error.title}</h2>
        <p className="pb-auth-panel-copy">PaperBinder kept this route inside the current workspace.</p>
      </div>
      <div className="pb-auth-panel-body">
        <TenantHostErrorNotice error={error} />
      </div>
      {action ? <div className="pb-auth-panel-actions">{action}</div> : null}
    </section>
  );
}

function PaperBinderWordmark({ href }: { href: string }) {
  return (
    <a aria-label="PaperBinder home" className="pb-auth-brand-link" href={href}>
      <img alt="PaperBinder" className="pb-auth-brand-image" src="/brand/pb-full-logo-white.png" />
    </a>
  );
}

export function useIsDesktopShell() {
  const getMatches = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(desktopShellMediaQuery).matches
      : true;
  const [isDesktopShell, setIsDesktopShell] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setIsDesktopShell(true);
      return;
    }

    const mediaQueryList = window.matchMedia(desktopShellMediaQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktopShell(event.matches);
    };

    setIsDesktopShell(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, []);

  return isDesktopShell;
}

function TenantNavigationIcon({ path }: { path: string }) {
  switch (path) {
    case "/app":
      return (
        <svg aria-hidden="true" className="pb-auth-nav-icon" viewBox="0 0 24 24">
          <rect height="6" rx="1.5" width="6" x="3" y="3" />
          <rect height="6" rx="1.5" width="6" x="15" y="3" />
          <rect height="6" rx="1.5" width="6" x="3" y="15" />
          <rect height="6" rx="1.5" width="6" x="15" y="15" />
        </svg>
      );
    case "/app/binders":
      return (
        <svg aria-hidden="true" className="pb-auth-nav-icon" viewBox="0 0 24 24">
          <path d="M3.5 7.5h6l2 2h9v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
          <path d="M3.5 7.5v-1a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "/app/users":
      return (
        <svg aria-hidden="true" className="pb-auth-nav-icon" viewBox="0 0 24 24">
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M4 18a5 5 0 0 1 10 0" />
          <path d="M14 18a4 4 0 0 1 6 0" />
        </svg>
      );
    default:
      return null;
  }
}

function SignOutIcon() {
  return (
    <svg aria-hidden="true" className="pb-auth-action-icon" viewBox="0 0 24 24">
      <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M9 12h9" />
    </svg>
  );
}

function TenantNavigation({
  onNavigate
}: {
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Workspace navigation" className="pb-auth-nav">
      {tenantNavigationItems.map((route) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              "pb-auth-nav-link",
              isActive ? "pb-auth-nav-link--active" : null
            )
          }
          end={route.path === "/app"}
          key={route.path}
          onClick={onNavigate}
          to={route.path}
        >
          <TenantNavigationIcon path={route.path} />
          <span className="pb-auth-nav-label">{route.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function TenantShellFooter({
  aboutUrl
}: {
  aboutUrl: string;
}) {
  return (
    <div className="pb-auth-sidebar-footer">
      <div className="pb-auth-sidebar-footer-row">
        <p className="pb-auth-sidebar-context-label">Copyright</p>
        <p className="pb-auth-sidebar-context-value">&copy; 2026 PaperBinder</p>
      </div>
      <div className="pb-auth-sidebar-footer-row">
        <p className="pb-auth-sidebar-context-label">Version</p>
        <p className="pb-auth-sidebar-context-value pb-auth-sidebar-context-value--host">
          v{packageJson.version}
        </p>
      </div>
      <div className="pb-auth-sidebar-footer-row">
        <p className="pb-auth-sidebar-context-label">Designed by</p>
        <p className="pb-auth-sidebar-context-value">{productIdentity.authorName}</p>
      </div>
      <a className="pb-auth-sidebar-footer-link" href={aboutUrl} rel="noreferrer" target="_blank">
        About PaperBinder
      </a>
    </div>
  );
}

export function TenantShell({
  apiClient,
  hostContext,
  navigator
}: {
  apiClient: PaperBinderApiClient;
  hostContext: TenantHostContext;
  navigator: TenantHostNavigator;
}) {
  const [lease, setLease] = useState<TenantLeaseSummary | null>(null);
  const [impersonation, setImpersonation] = useState<TenantImpersonationStatus | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [bootstrapError, setBootstrapError] = useState<TenantBootstrapViewModel | null>(null);
  const [shellError, setShellError] = useState<TenantHostErrorViewModel | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isExtending, setIsExtending] = useState(false);
  const [isStoppingImpersonation, setIsStoppingImpersonation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toasts, setToasts] = useState<TenantShellToast[]>([]);
  const [pausedToastIds, setPausedToastIds] = useState<string[]>([]);
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const nextToastIdRef = useRef(0);
  const toastDismissStateRef = useRef(new Map<string, ToastDismissState>());
  const expiryRefreshAttemptedRef = useRef(false);
  const extensionWindowRefreshAttemptedRef = useRef(false);
  const mobileMenuRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const rootLoginUrl = toRootLoginUrl(hostContext.environment.rootUrl, hostContext.tenantSlug);
  const rootHomeUrl = toRootHomeUrl(hostContext.environment.rootUrl, hostContext.tenantSlug);
  const rootHomeUrlWithWorkspace = toRootHomeUrl(hostContext.environment.rootUrl, hostContext.tenantSlug);
  const isDesktopShell = useIsDesktopShell();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setDocumentTitle(resolveTenantPageTitle(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktopShell) {
      setIsMobileMenuOpen(false);
    }
  }, [isDesktopShell]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (mobileMenuRef.current?.contains(target) || mobileMenuButtonRef.current?.contains(target)) {
        return;
      }

      setIsMobileMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  function showToast({ title, body, variant = "info" }: TenantShellToastInput) {
    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id: `tenant-toast-${nextToastIdRef.current++}`,
        title,
        body,
        variant
      }
    ]);
  }

  function dismissToast(toastId: string) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
    const dismissState = toastDismissStateRef.current.get(toastId);
    if (dismissState !== undefined && dismissState.timeoutId !== null) {
      window.clearTimeout(dismissState.timeoutId);
    }

    toastDismissStateRef.current.delete(toastId);
    setPausedToastIds((currentIds) => currentIds.filter((currentId) => currentId !== toastId));
  }

  function scheduleToastDismiss(toastId: string) {
    const dismissState = toastDismissStateRef.current.get(toastId);
    if (dismissState === undefined) {
      return;
    }

    if (dismissState.timeoutId !== null) {
      window.clearTimeout(dismissState.timeoutId);
    }

    dismissState.startedAt = Date.now();
    dismissState.timeoutId = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((currentToast) => currentToast.id !== toastId));
      toastDismissStateRef.current.delete(toastId);
      setPausedToastIds((currentIds) => currentIds.filter((currentId) => currentId !== toastId));
    }, dismissState.remainingMs);
  }

  function pauseToastDismiss(toastId: string) {
    const dismissState = toastDismissStateRef.current.get(toastId);
    if (dismissState === undefined || dismissState.timeoutId === null) {
      return;
    }

    window.clearTimeout(dismissState.timeoutId);
    dismissState.timeoutId = null;
    dismissState.remainingMs = Math.max(
      0,
      dismissState.remainingMs - (Date.now() - (dismissState.startedAt ?? Date.now()))
    );
    dismissState.startedAt = null;
    setPausedToastIds((currentIds) => (currentIds.includes(toastId) ? currentIds : [...currentIds, toastId]));
  }

  function resumeToastDismiss(toastId: string) {
    const dismissState = toastDismissStateRef.current.get(toastId);
    if (dismissState === undefined || dismissState.timeoutId !== null) {
      return;
    }

    if (dismissState.remainingMs <= 0) {
      dismissToast(toastId);
      return;
    }

    setPausedToastIds((currentIds) => currentIds.filter((currentId) => currentId !== toastId));
    scheduleToastDismiss(toastId);
  }

  const refreshShellState = useEffectEvent(
    async ({ bootstrap = false, signal }: { bootstrap?: boolean; signal?: AbortSignal } = {}) => {
      try {
        const [nextLease, nextImpersonation] = await Promise.all([
          apiClient.getTenantLease(signal),
          apiClient.getImpersonationStatus(signal)
        ]);
        if (signal?.aborted) {
          return;
        }

        setLease(nextLease);
        setImpersonation(nextImpersonation);
        setCountdownSeconds(normalizeCountdownSeconds(nextLease.secondsRemaining));
        setBootstrapError(null);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }

        if (bootstrap || lease === null || impersonation === null) {
          setBootstrapError(createBootstrapViewModel(error));
          return;
        }

        if (isTerminalShellFailure(error)) {
          setShellError(null);
          setBootstrapError(createBootstrapViewModel(error));
          return;
        }

        setShellError(mapTenantHostError(error));
      } finally {
        if (bootstrap) {
          setIsBootstrapping(false);
        }
      }
    }
  );

  useEffect(() => {
    const abortController = new AbortController();
    setIsBootstrapping(true);
    setShellError(null);
    setBootstrapError(null);
    void refreshShellState({ bootstrap: true, signal: abortController.signal });

    return () => {
      abortController.abort();
    };
  }, [hostContext.currentHost]);

  useEffect(() => {
    if (lease === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCountdownSeconds((currentSeconds) => (currentSeconds > 0 ? currentSeconds - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [lease]);

  useEffect(() => {
    if (lease === null || bootstrapError !== null) {
      return;
    }

    if (countdownSeconds > 0) {
      expiryRefreshAttemptedRef.current = false;
      return;
    }

    if (expiryRefreshAttemptedRef.current) {
      return;
    }

    expiryRefreshAttemptedRef.current = true;
    void refreshShellState();
  }, [bootstrapError, countdownSeconds, lease, refreshShellState]);

  useEffect(() => {
    if (lease === null || bootstrapError !== null) {
      return;
    }

    if (lease.canExtend || countdownSeconds <= 0 || countdownSeconds > leaseExtensionWindowSeconds) {
      extensionWindowRefreshAttemptedRef.current = false;
      return;
    }

    if (extensionWindowRefreshAttemptedRef.current) {
      return;
    }

    extensionWindowRefreshAttemptedRef.current = true;
    void refreshShellState();
  }, [bootstrapError, countdownSeconds, lease, refreshShellState]);

  useEffect(() => {
    const activeToastIds = new Set(toasts.slice(0, 3).map((toast) => toast.id));

    for (const [toastId, dismissState] of toastDismissStateRef.current.entries()) {
      if (!activeToastIds.has(toastId)) {
        if (dismissState.timeoutId !== null) {
          window.clearTimeout(dismissState.timeoutId);
        }

        toastDismissStateRef.current.delete(toastId);
      }
    }

    setPausedToastIds((currentIds) => currentIds.filter((toastId) => activeToastIds.has(toastId)));

    for (const toast of toasts.slice(0, 3)) {
      if (!isToastAutoDismissable(toast.variant) || toastDismissStateRef.current.has(toast.id)) {
        continue;
      }

      toastDismissStateRef.current.set(toast.id, {
        timeoutId: null,
        remainingMs: toastAutoDismissMs,
        startedAt: null
      });
      scheduleToastDismiss(toast.id);
    }
  }, [toasts]);

  useEffect(() => {
    return () => {
      for (const dismissState of toastDismissStateRef.current.values()) {
        if (dismissState.timeoutId !== null) {
          window.clearTimeout(dismissState.timeoutId);
        }
      }

      toastDismissStateRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (lease === null || impersonation === null || isBootstrapping) {
      previousPathRef.current = location.pathname;
      return;
    }

    if (previousPathRef.current === location.pathname) {
      return;
    }

    previousPathRef.current = location.pathname;
    void refreshShellState();
  }, [impersonation, isBootstrapping, lease, location.pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshShellState();
      }
    }, 60000);

    const handleFocus = () => {
      void refreshShellState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshShellState();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleExtendLease() {
    setShellError(null);
    setIsExtending(true);

    try {
      const nextLease = await apiClient.extendTenantLease();
      setLease(nextLease);
      setCountdownSeconds(normalizeCountdownSeconds(nextLease.secondsRemaining));
    } catch (error) {
      if (isTerminalShellFailure(error)) {
        setShellError(null);
        setBootstrapError(createBootstrapViewModel(error));
        return;
      }

      setShellError(mapTenantHostError(error));
    } finally {
      setIsExtending(false);
    }
  }

  async function handleStopImpersonation(): Promise<TenantImpersonationStatus> {
    setShellError(null);
    setIsStoppingImpersonation(true);

    try {
      const nextImpersonation = await apiClient.stopImpersonation();
      setImpersonation(nextImpersonation);
      return nextImpersonation;
    } catch (error) {
      if (isTerminalShellFailure(error)) {
        setShellError(null);
        setBootstrapError(createBootstrapViewModel(error));
        throw error;
      }

      setShellError(mapTenantHostError(error));
      throw error;
    } finally {
      setIsStoppingImpersonation(false);
    }
  }

  async function handleStartImpersonation(userId: string) {
    const nextImpersonation = await apiClient.startImpersonation(userId);
    setImpersonation(nextImpersonation);
    return nextImpersonation;
  }

  async function handleLogout() {
    setShellError(null);
    setIsLoggingOut(true);

    try {
      const { redirectUrl } = await apiClient.logout();
      navigator(redirectUrl);
    } catch (error) {
      setShellError(mapTenantHostError(error));
      setIsLoggingOut(false);
      return;
    }

    setIsLoggingOut(false);
  }

  if (isBootstrapping) {
    return <TenantShellLoadingPage />;
  }

  if (bootstrapError !== null || lease === null || impersonation === null) {
    return (
      <TenantBootstrapFailurePage
        error={bootstrapError ?? createBootstrapViewModel(null)}
        rootHomeUrl={rootHomeUrl}
        rootLoginUrl={rootLoginUrl}
      />
    );
  }

  const visibleToasts = toasts.slice(0, 3);
  const queuedToastCount = Math.max(0, toasts.length - visibleToasts.length);
  const isViewingAs = impersonation.isImpersonating;
  const aboutUrl = toRootAboutUrl(hostContext.environment.rootUrl, hostContext.tenantSlug);
  const accountEmail = isViewingAs ? impersonation.effective.email : impersonation.actor.email;
  const accountLabel = isViewingAs ? "Viewing as" : "Logged in as";

  return (
    <div className="pb-auth-shell">
      {visibleToasts.length > 0 ? (
        <ToastViewport hiddenCount={queuedToastCount}>
          {visibleToasts.map((toast) => (
            <Toast
              body={toast.body}
              key={toast.id}
              onDismiss={() => dismissToast(toast.id)}
              onDismissPause={() => pauseToastDismiss(toast.id)}
              onDismissResume={() => resumeToastDismiss(toast.id)}
              showTimeoutBar={isToastAutoDismissable(toast.variant)}
              timeoutBarDurationMs={toastAutoDismissMs}
              timeoutBarPaused={pausedToastIds.includes(toast.id)}
              title={toast.title}
              variant={toast.variant}
            />
          ))}
        </ToastViewport>
      ) : null}
      <div className="pb-auth-grid">
        {isDesktopShell ? (
          <aside className="pb-auth-sidebar">
            <div className="pb-auth-sidebar-brandlockup">
              <div className="pb-auth-sidebar-brand">
                <PaperBinderWordmark href={rootHomeUrlWithWorkspace} />
              </div>
            </div>

            <div className="pb-auth-sidebar-separator" />

            <TenantNavigation />

            <TenantShellFooter aboutUrl={aboutUrl} />
          </aside>
        ) : null}

        <main className="pb-auth-main">
          {!isDesktopShell ? (
            <div className="pb-auth-mobile-shell-chrome">
              <header className="pb-auth-mobile-header">
                <PaperBinderWordmark href={rootHomeUrlWithWorkspace} />
                <button
                  aria-controls="pb-auth-mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? "Close workspace menu" : "Open workspace menu"}
                  className="pb-auth-mobile-menu-button"
                  onClick={() => setIsMobileMenuOpen((currentState) => !currentState)}
                  ref={mobileMenuButtonRef}
                  type="button"
                >
                  <span className="pb-auth-mobile-menu-button__label">Menu</span>
                  <span aria-hidden="true" className="pb-auth-mobile-menu-button__icon">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              </header>

              {isViewingAs ? (
                <p className="pb-auth-mobile-viewing-as">
                  <StatusBadge variant="warning">Viewing as</StatusBadge> {accountEmail}
                </p>
              ) : null}

              {isMobileMenuOpen ? (
                <section className="pb-auth-mobile-menu" id="pb-auth-mobile-menu" ref={mobileMenuRef}>
                  <div className="pb-auth-mobile-menu__section">
                    <p className="pb-auth-header-account-label">{accountLabel}</p>
                    <p className="pb-auth-mobile-menu__identity">{accountEmail}</p>
                    {isViewingAs ? (
                      <p className="pb-auth-mobile-menu__meta">Signed in as {impersonation.actor.email}</p>
                    ) : null}
                  </div>
                  <div className="pb-auth-mobile-menu__section">
                    <p className="pb-auth-header-pill-label">Tenant</p>
                    <p className="pb-auth-mobile-menu__tenant">{hostContext.tenantSlug}</p>
                  </div>
                  <div className="pb-auth-mobile-menu__section">
                    <TenantNavigation onNavigate={() => setIsMobileMenuOpen(false)} />
                  </div>
                  <div className="pb-auth-mobile-menu__actions">
                    {isViewingAs ? (
                      <Button
                        isLoading={isStoppingImpersonation}
                        onClick={() => {
                          void handleStopImpersonation();
                        }}
                        type="button"
                        variant="danger"
                      >
                        Stop view as
                      </Button>
                    ) : null}
                    <Button
                      className="pb-auth-mobile-menu-signout"
                      isLoading={isLoggingOut}
                      onClick={() => void handleLogout()}
                      type="button"
                      variant="secondary"
                    >
                      <span className="pb-auth-shell-action-content">
                        <SignOutIcon />
                        Sign out
                      </span>
                    </Button>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {isDesktopShell ? (
            <header className="pb-auth-header">
              <div className="pb-auth-header-account">
                <div className="pb-auth-header-account-copy">
                  <p className="pb-auth-header-account-label">{accountLabel}</p>
                  <p className="pb-auth-header-account-value">{accountEmail}</p>
                  {isViewingAs ? (
                    <p className="pb-auth-header-account-meta">Signed in as {impersonation.actor.email}</p>
                  ) : null}
                </div>
                {isViewingAs ? (
                  <Button
                    isLoading={isStoppingImpersonation}
                    onClick={() => {
                      void handleStopImpersonation();
                    }}
                    type="button"
                    variant="danger"
                  >
                    Stop view as
                  </Button>
                ) : null}
              </div>
              <div className="pb-auth-header-actions">
                <div className="pb-auth-header-pill">
                  <p className="pb-auth-header-pill-label">Tenant</p>
                  <p className="pb-auth-header-pill-value">{hostContext.tenantSlug}</p>
                </div>
                <Button isLoading={isLoggingOut} onClick={() => void handleLogout()} type="button" variant="secondary">
                  <span className="pb-auth-shell-action-content">
                    <SignOutIcon />
                    Sign out
                  </span>
                </Button>
              </div>
            </header>
          ) : null}

          <div className="pb-auth-shell-body">
            {lease.canExtend || (countdownSeconds > 0 && countdownSeconds <= leaseExtensionWindowSeconds) ? (
              <TenantLeaseBanner
                countdownSeconds={countdownSeconds}
                isExtending={isExtending}
                lease={lease}
                onExtend={handleExtendLease}
              />
            ) : null}
            <TenantHostErrorNotice error={shellError} />
            <Outlet
              context={
                {
                  apiClient,
                  hostContext,
                  lease,
                  countdownSeconds,
                  impersonation,
                  startImpersonation: handleStartImpersonation,
                  stopImpersonation: handleStopImpersonation,
                  showToast
                } satisfies TenantShellOutletContext
              }
            />
          </div>

          {!isDesktopShell ? (
            <footer className="pb-auth-mobile-footer">
              <TenantShellFooter aboutUrl={aboutUrl} />
            </footer>
          ) : null}
        </main>
      </div>
    </div>
  );
}
