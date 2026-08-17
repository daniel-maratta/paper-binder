import type { HostContext } from "../app/host-context";
import {
  publicStandaloneRouteDefinitions,
  rootRouteDefinitions,
  tenantNavigationItems
} from "../app/route-registry";
import { flagshipArticle } from "../content/articles/flagship-article";
import { legalDocuments } from "../content/legal/legal-documents";
import type { FrontendEnvironment } from "../environment";

const goatCounterEndpoint = "https://paperbinder.goatcounter.com/count";
const publicFallbackAnalyticsPath = "/not-found";
const tenantFallbackAnalyticsPath = "/app/*";

export const publicAnalyticsEventNames = {
  headerBrand: "pb_event_public_header_brand",
  headerNavProduct: "pb_event_public_header_nav_product",
  headerNavDemo: "pb_event_public_header_nav_demo",
  headerNavAbout: "pb_event_public_header_nav_about",
  headerStartDemo: "pb_event_public_header_start_demo",
  headerOpenWorkspace: "pb_event_public_header_open_workspace",
  landingStartDemo: "pb_event_public_landing_start_demo",
  landingOpenWorkspace: "pb_event_public_landing_open_workspace",
  landingLearnMore: "pb_event_public_landing_learn_more",
  aboutReadArticle: "pb_event_public_about_read_article",
  footerProductNav: "pb_event_public_footer_product_nav",
  footerLegalNav: "pb_event_public_footer_legal_nav",
  footerProjectLink: "pb_event_public_footer_project_link",
  legalPolicyNav: "pb_event_public_legal_policy_nav",
  articleExternalLink: "pb_event_public_article_external_link",
  articleSectionNav: "pb_event_public_article_section_nav",
  demoSubmitAttempt: "pb_event_public_demo_submit_attempt",
  demoSubmitSucceeded: "pb_event_public_demo_submit_succeeded",
  demoOpenWorkspace: "pb_event_public_demo_open_workspace",
  demoGoToSignIn: "pb_event_public_demo_go_to_sign_in",
  loginSubmitAttempt: "pb_event_public_login_submit_attempt",
  loginSubmitSucceeded: "pb_event_public_login_submit_succeeded",
  loginContinueManually: "pb_event_public_login_continue_manually",
  loginStartDemo: "pb_event_public_login_start_demo"
} as const;

export type PublicAnalyticsEventName =
  (typeof publicAnalyticsEventNames)[keyof typeof publicAnalyticsEventNames];

type GoatCounterHit = {
  path: string;
  title: string;
  referrer: string;
  event: boolean;
};

export const publicAnalyticsRouteDefinitions = [
  ...rootRouteDefinitions,
  ...publicStandaloneRouteDefinitions,
  {
    path: flagshipArticle.path,
    label: "Flagship article",
    title: flagshipArticle.title,
    description: flagshipArticle.description
  },
  ...legalDocuments.map((document) => ({
    path: document.path,
    label: document.title,
    title: document.title,
    description: document.description
  }))
] as const;

const publicAnalyticsPathByRoutePath = new Map(
  publicAnalyticsRouteDefinitions.map((route) => [route.path, route.path] as const)
);

const tenantStaticAnalyticsPaths = new Set(tenantNavigationItems.map((route) => route.path));

let lastTrackedPageviewKey: string | null = null;

function trimPort(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function isLocalHostLike(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost === "[::1]" ||
    normalizedHost.endsWith(".localhost")
  );
}

function isPaperBinderHost(hostname: string, environment: FrontendEnvironment): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();
  const rootHostname = new URL(environment.rootUrl).hostname.toLowerCase();
  const tenantBaseHostname = trimPort(environment.tenantBaseDomain);

  return normalizedHostname === rootHostname || normalizedHostname.endsWith(`.${tenantBaseHostname}`);
}

function resolveHostContextHostname(hostContext: HostContext): string {
  try {
    return new URL(hostContext.currentOrigin).hostname;
  } catch {
    return trimPort(hostContext.currentHost);
  }
}

function normalizePathname(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalizedPathname.length > 1 ? normalizedPathname.replace(/\/+$/, "") : normalizedPathname;
}

function resolveScreenSize(): string | null {
  const width = window.screen?.width;
  const height = window.screen?.height;
  const scale = window.devicePixelRatio;

  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof scale !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(scale) ||
    width <= 0 ||
    height <= 0 ||
    scale <= 0
  ) {
    return null;
  }

  return `${Math.round(width)},${Math.round(height)},${scale}`;
}

function buildGoatCounterCountUrl(hit: GoatCounterHit): string {
  const url = new URL(goatCounterEndpoint);
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  url.searchParams.set("p", hit.path);
  url.searchParams.set("t", hit.title);
  url.searchParams.set("r", hit.referrer);
  url.searchParams.set("rnd", randomId);

  if (hit.event) {
    url.searchParams.set("e", "true");
  }

  const screenSize = resolveScreenSize();
  if (screenSize !== null) {
    url.searchParams.set("s", screenSize);
  }

  return url.toString();
}

function sendGoatCounterHit(hit: GoatCounterHit) {
  try {
    const image = new Image();
    image.referrerPolicy = "no-referrer";
    image.src = buildGoatCounterCountUrl(hit);
  } catch {
    // Analytics must never block the demo surface.
  }
}

function resolveAnalyticsTitle(path: string, event: boolean): string {
  if (event) {
    return path;
  }

  const matchingPublicRoute = publicAnalyticsRouteDefinitions.find((route) => route.path === path);
  if (matchingPublicRoute !== undefined) {
    return matchingPublicRoute.title;
  }

  const matchingTenantRoute = tenantNavigationItems.find((route) => route.path === path);
  if (matchingTenantRoute !== undefined) {
    return matchingTenantRoute.label;
  }

  return path;
}

export function resolvePaperBinderAnalyticsPath(pathname: string, hostKind: HostContext["kind"]): string | null {
  const normalizedPathname = normalizePathname(pathname);

  if (hostKind === "invalid") {
    return null;
  }

  if (hostKind === "root") {
    return publicAnalyticsPathByRoutePath.get(normalizedPathname) ?? publicFallbackAnalyticsPath;
  }

  if (tenantStaticAnalyticsPaths.has(normalizedPathname as (typeof tenantNavigationItems)[number]["path"])) {
    return normalizedPathname;
  }

  if (/^\/app\/binders\/[^/]+$/.test(normalizedPathname)) {
    return "/app/binders/:binderId";
  }

  if (/^\/app\/documents\/[^/]+$/.test(normalizedPathname)) {
    return "/app/documents/:documentId";
  }

  return tenantFallbackAnalyticsPath;
}

export function resolvePaperBinderAnalyticsReferrer(
  referrer: string,
  environment: FrontendEnvironment
): string {
  if (referrer.trim().length === 0) {
    return "";
  }

  try {
    const referrerUrl = new URL(referrer);
    if (isPaperBinderHost(referrerUrl.hostname, environment)) {
      return "";
    }

    return `${referrerUrl.origin}${referrerUrl.pathname}`;
  } catch {
    return "";
  }
}

export function shouldEnablePaperBinderAnalytics(
  hostContext: HostContext,
  hostname: string = window.location.hostname
): boolean {
  if (!hostContext.environment.analyticsEnabled || hostContext.kind === "invalid" || isLocalHostLike(hostname)) {
    return false;
  }

  return isPaperBinderHost(hostname, hostContext.environment);
}

export function trackPaperBinderPageview(hostContext: HostContext, pathname: string) {
  if (!shouldEnablePaperBinderAnalytics(hostContext, resolveHostContextHostname(hostContext))) {
    return;
  }

  const analyticsPath = resolvePaperBinderAnalyticsPath(pathname, hostContext.kind);
  if (analyticsPath === null) {
    return;
  }

  const trackingKey = `${hostContext.kind}:${analyticsPath}`;
  if (lastTrackedPageviewKey === trackingKey) {
    return;
  }

  lastTrackedPageviewKey = trackingKey;

  sendGoatCounterHit({
    path: analyticsPath,
    title: resolveAnalyticsTitle(analyticsPath, false),
    referrer: resolvePaperBinderAnalyticsReferrer(document.referrer, hostContext.environment),
    event: false
  });
}

export function trackPaperBinderEvent(hostContext: HostContext, eventName: PublicAnalyticsEventName) {
  if (!shouldEnablePaperBinderAnalytics(hostContext, resolveHostContextHostname(hostContext))) {
    return;
  }

  sendGoatCounterHit({
    path: eventName,
    title: eventName,
    referrer: "",
    event: true
  });
}

export function resetPaperBinderAnalyticsForTests() {
  lastTrackedPageviewKey = null;
}
