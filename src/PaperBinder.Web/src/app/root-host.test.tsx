import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRouter } from "../App";
import { PaperBinderApiError, type PaperBinderApiClient } from "../api/client";
import { publicAnalyticsEventNames } from "../analytics/goatcounter";
import { flagshipArticle } from "../content/articles/flagship-article";
import { productIdentity } from "./product-identity";
import {
  createApiClientStub,
  createProvisionResponse,
  createRootHostContext,
  testEnvironment
} from "../test/test-helpers";

type TurnstileRenderOptions = {
  callback?: (token: string) => void;
};

function installTurnstileStub(token = "paperbinder-test-challenge-pass") {
  const widgets = new Map<
    string,
    {
      button: HTMLButtonElement;
      container: HTMLElement;
      options: TurnstileRenderOptions;
    }
  >();
  let widgetCount = 0;

  const renderMock = vi.fn((container: HTMLElement, options: TurnstileRenderOptions) => {
    const widgetId = `widget-${widgetCount += 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Complete challenge";
    button.addEventListener("click", () => {
      button.textContent = "Challenge complete";
      options.callback?.(token);
    });

    container.replaceChildren(button);
    widgets.set(widgetId, { button, container, options });
    return widgetId;
  });

  const resetMock = vi.fn((widgetId: string) => {
    const widget = widgets.get(widgetId);
    if (!widget) {
      return;
    }

    widget.button.textContent = "Complete challenge";
  });

  const removeMock = vi.fn((widgetId: string) => {
    const widget = widgets.get(widgetId);
    if (!widget) {
      return;
    }

    widget.container.replaceChildren();
    widgets.delete(widgetId);
  });

  window.turnstile = {
    render: renderMock,
    reset: resetMock,
    remove: removeMock
  };

  return {
    renderMock,
    resetMock,
    removeMock
  };
}

function installMatchMediaStub(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

function installResponsiveMatchMediaStub(resolveMatches: (query: string) => boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: resolveMatches(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

function renderRootRoute({
  route = "/",
  apiClient,
  navigator = vi.fn<(redirectUrl: string) => void>(),
  challengeLocalBypassEnabled = false
}: {
  route?: string;
  apiClient?: PaperBinderApiClient;
  navigator?: (redirectUrl: string) => void;
  challengeLocalBypassEnabled?: boolean;
}) {
  const resolvedApiClient = apiClient ?? createApiClientStub();
  const hostContext = createRootHostContext(route);
  if (hostContext.kind !== "root") {
    throw new Error("Expected root-host context for root-host test.");
  }

  render(
    <MemoryRouter initialEntries={[route]}>
      <AppRouter
        apiClient={resolvedApiClient}
        hostContext={{
          ...hostContext,
          environment: {
            ...testEnvironment,
            challengeLocalBypassEnabled
          }
        }}
        rootHostNavigator={navigator}
      />
    </MemoryRouter>
  );

  return {
    apiClient: resolvedApiClient,
    navigator
  };
}

function expectAnalyticsEvent(element: HTMLElement, eventName: string) {
  expect(element).toHaveAttribute("data-paperbinder-analytics-event", eventName);
}

afterEach(() => {
  delete window.turnstile;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("root-host flows", () => {
  it("Should_ExplainPaperBinderInPlainLanguage_When_PublicHomeLoads", async () => {
    renderRootRoute({
      route: "/"
    });

    expect(screen.getByRole("heading", { name: "What is PaperBinder?" })).toBeInTheDocument();
    expect(screen.getByText(/important internal documents/i)).toBeInTheDocument();
    expect(screen.getByText(/policies, procedures, handbooks, and internal reference material/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace contains binders, read-only text records, and access controls/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start demo" })).toHaveAttribute("href", "/start-demo");
  });

  it("Should_LinkFlagshipArticleFromHomepage_When_PublicHomeLoads", async () => {
    renderRootRoute({
      route: "/"
    });

    expect(screen.getByRole("heading", { name: "Behind the build" })).toBeInTheDocument();
    expect(screen.getByText(/the live demo shows the product/i)).toBeInTheDocument();

    const readArticleLink = screen.getByRole("link", { name: "Read article" });
    expect(readArticleLink).toHaveAttribute("href", flagshipArticle.path);
    expectAnalyticsEvent(readArticleLink, "pb_event_public_landing_read_article");
  });

  it("Should_LinkPublicFooterAttributionToAuthorSite_When_PublicHomeLoads", async () => {
    renderRootRoute({
      route: "/"
    });

    const authorLink = screen.getByRole("link", { name: productIdentity.authorName });
    expect(authorLink).toHaveAttribute("href", productIdentity.authorUrl);
    expect(authorLink).toHaveAttribute("rel", "noreferrer");
    expect(authorLink).toHaveAttribute("target", "_blank");
    expectAnalyticsEvent(authorLink, publicAnalyticsEventNames.footerAuthorLink);
    expect(authorLink.closest("p")).toHaveTextContent("\u00a9 2026 Daniel Maratta");
  });

  it("Should_RenderProductLedLanding_Without_InlineProvisioningOrLogin_When_PublicHomeLoads", async () => {
    renderRootRoute({
      route: "/"
    });

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Root host navigation")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Product" }).some((link) => link.getAttribute("href") === "/")).toBe(true);
    expect(screen.getAllByRole("link", { name: "Demo" }).some((link) => link.getAttribute("href") === "/start-demo")).toBe(true);
    expect(screen.getAllByRole("link", { name: "About" }).some((link) => link.getAttribute("href") === "/about")).toBe(true);
    expect(
      screen.getByRole("heading", { name: "A focused workspace for policies, procedures, and internal docs." })
    ).toBeInTheDocument();
    expect(screen.getByText(/one place to organize binders/i)).toBeInTheDocument();
    expect(
      screen.queryByText(
        "PaperBinder gives each demo workspace a clear place to organize binders, read-only documents, and access controls you can try in the live product."
      )
    ).not.toBeInTheDocument();
    const landingStartDemoLink = screen.getByRole("link", { name: "Start demo" });
    expect(landingStartDemoLink).toHaveAttribute("href", "/start-demo");
    expectAnalyticsEvent(landingStartDemoLink, publicAnalyticsEventNames.landingStartDemo);
    expect(
      screen.getByRole("img", {
        name: "PaperBinder dashboard with lease details, recent binders, and next actions."
      })
    ).toHaveAttribute("src", "/presentation/dashboard-proof.png");
    expect(
      screen.getByRole("img", {
        name: "PaperBinder binders page in a mobile workspace view."
      })
    ).toHaveAttribute("src", "/presentation/binders-proof.png");
    expect(
      screen.getByRole("img", {
        name: "PaperBinder users page with current users, role changes, and view as actions."
      })
    ).toHaveAttribute("src", "/presentation/users-proof.png");
    expect(screen.getByRole("heading", { name: "Separate workspaces" })).toBeInTheDocument();
    expect(screen.getByText("Each demo workspace keeps its information separate.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Access controls" })).toBeInTheDocument();
    expect(screen.getByText("Roles decide what each user can see and do.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Read-only records" })).toBeInTheDocument();
    expect(screen.getByText("Documents are kept as reviewable text records instead of editable drafts.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Temporary demo space" })).toBeInTheDocument();
    expect(screen.getByText("Demo workspaces expire automatically.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manage access without leaving the workspace." })).toBeInTheDocument();
    expect(screen.getByText("User creation and credential generation happen in one flow.")).toBeInTheDocument();
    expect(
      screen.getByText("Workspace admins can view users, adjust roles, and issue generated credentials from one route.")
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start with the product, not a setup checklist." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create a temporary workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Save the generated credentials" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review the live product flows" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Start Demo" }).some((link) => link.getAttribute("href") === "/start-demo")
    ).toBe(true);
    const learnMoreLink = screen.getByRole("link", { name: "Learn more" });
    expect(learnMoreLink).toHaveAttribute("href", "/about");
    expectAnalyticsEvent(learnMoreLink, publicAnalyticsEventNames.landingLearnMore);
    expect(
      screen.getByText("A focused document workspace demo designed and built by Daniel Maratta.")
    ).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) =>
        element?.classList.contains("pb-public-footer-copyright") === true &&
        element.textContent === "\u00a9 2026 Daniel Maratta"
      )
    ).toBeInTheDocument();
    expect(document.title).toBe("Home | PaperBinder");
    expect(screen.getByRole("link", { name: "Live project" })).toHaveAttribute(
      "href",
      "https://paperbinder.danielmaratta.com"
    );
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute(
      "href",
      "https://danielmaratta.com"
    );
    expect(screen.getByRole("link", { name: "Repository history" })).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder"
    );
    expect(screen.getByRole("heading", { level: 2, name: "Legal" })).toBeInTheDocument();
    const legalIndexLink = screen.getByRole("link", { name: "Legal" });
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    const termsLink = screen.getByRole("link", { name: "Terms of Use" });
    const cookiesLink = screen.getByRole("link", { name: "Cookie Notice" });
    expect(legalIndexLink).toHaveAttribute("href", "/legal");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(termsLink).toHaveAttribute("href", "/terms");
    expect(cookiesLink).toHaveAttribute("href", "/cookies");
    expectAnalyticsEvent(legalIndexLink, publicAnalyticsEventNames.footerLegalNav);
    expectAnalyticsEvent(privacyLink, publicAnalyticsEventNames.footerLegalNav);
    expectAnalyticsEvent(termsLink, publicAnalyticsEventNames.footerLegalNav);
    expectAnalyticsEvent(cookiesLink, publicAnalyticsEventNames.footerLegalNav);
    expect(screen.queryByLabelText("Workspace name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("Should_ExposeTrackedPublicNavigation_When_PublicHeaderRendersAtMobileWidth", async () => {
    installResponsiveMatchMediaStub((query) => query === "(max-width: 1024px)");

    renderRootRoute({
      route: "/"
    });

    const menuButton = screen.getByRole("button", { name: "Public navigation" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile public navigation" })).not.toBeInTheDocument();

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile public navigation" });
    const productLink = within(mobileNavigation).getByRole("link", { name: "Product" });
    const demoLink = within(mobileNavigation).getByRole("link", { name: "Demo" });
    const aboutLink = within(mobileNavigation).getByRole("link", { name: "About" });

    expect(productLink).toHaveAttribute("href", "/");
    expect(demoLink).toHaveAttribute("href", "/start-demo");
    expect(aboutLink).toHaveAttribute("href", "/about");
    expectAnalyticsEvent(productLink, publicAnalyticsEventNames.headerNavProduct);
    expectAnalyticsEvent(demoLink, publicAnalyticsEventNames.headerNavDemo);
    expectAnalyticsEvent(aboutLink, publicAnalyticsEventNames.headerNavAbout);

    fireEvent.click(aboutLink);

    expect(await screen.findByRole("heading", { name: "About PaperBinder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Public navigation" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile public navigation" })).not.toBeInTheDocument();
  });

  it("Should_ClipPublicDecor_AndKeepDecorNodes_When_StartDemoLoads", async () => {
    renderRootRoute({
      route: "/start-demo"
    });

    expect(document.querySelector(".pb-public-site")).toHaveClass("pb-public-site--clipped-decor");
    const decorLayer = document.querySelector(".pb-public-decor-layer");
    expect(decorLayer).toHaveAttribute("aria-hidden", "true");
    expect(decorLayer?.querySelector(".pb-public-decor--ring")).toBeInTheDocument();
    expect(decorLayer?.querySelector(".pb-public-decor--glow")).toBeInTheDocument();
  });

  it("Should_ClipPublicDecor_AndKeepDecorNodes_When_RootHostRouteIsUnavailable", async () => {
    renderRootRoute({
      route: "/app"
    });

    expect(screen.getByRole("heading", { name: "Page unavailable" })).toBeInTheDocument();
    expect(document.querySelector(".pb-public-site")).toHaveClass("pb-public-site--clipped-decor");
    const decorLayer = document.querySelector(".pb-public-decor-layer");
    expect(decorLayer).toHaveAttribute("aria-hidden", "true");
    expect(decorLayer?.querySelector(".pb-public-decor--ring")).toBeInTheDocument();
    expect(decorLayer?.querySelector(".pb-public-decor--glow")).toBeInTheDocument();
  });

  it("Should_RenderReviewerOrientedAboutPage_When_AboutRouteLoads", async () => {
    renderRootRoute({
      route: "/about"
    });

    expect(screen.getByRole("heading", { name: "About PaperBinder" })).toBeInTheDocument();
    expect(screen.getByText("PROJECT OVERVIEW")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A small, complete demo for internal document workspaces." })).toBeInTheDocument();
    expect(
      screen.getByText(
        "PaperBinder includes separate demo workspaces, binder-level access, read-only text documents, and generated credentials for trying the product."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Core model")).toBeInTheDocument();
    expect(screen.getByText("Binders and read-only text documents.")).toBeInTheDocument();
    expect(screen.getByText("Access boundary")).toBeInTheDocument();
    expect(screen.getByText("Access controls inside separate workspaces.")).toBeInTheDocument();
    expect(screen.getByText("Demo path")).toBeInTheDocument();
    expect(screen.getByText("Temporary demo workspaces with generated credentials.")).toBeInTheDocument();
    expect(screen.getByText("TECHNICAL WRITE-UP")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Featured article" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "A closer look at the architecture, scope decisions, and AI-assisted build process behind PaperBinder."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Building PaperBinder: From AI-Generated Code to Shippable Software" })
    ).toBeInTheDocument();
    const articleCard = screen
      .getByRole("heading", { name: "Building PaperBinder: From AI-Generated Code to Shippable Software" })
      .closest("article");
    expect(articleCard).not.toBeNull();
    const articleScope = within(articleCard!);
    expect(screen.getByText("Build story / scope / validation")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A walkthrough of the architecture, tradeoffs, scope boundaries, and implementation choices behind PaperBinder."
      )
    ).toBeInTheDocument();
    const readArticleLink = articleScope.getByRole("link", { name: "Read article" });
    expect(readArticleLink).toHaveAttribute("href", "/articles/building-paperbinder-production-shaped-saas-demo");
    expectAnalyticsEvent(readArticleLink, publicAnalyticsEventNames.aboutReadArticle);
    expect(articleScope.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.getByText("WHAT THIS DEMONSTRATES")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "A narrow product scope with real workspace boundaries." })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Separate workspaces" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Binder-level access" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Read-only documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Temporary demo workspace" })).toBeInTheDocument();
    expect(screen.getByText("INTENTIONAL SCOPE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Small by design." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "In scope" })).toBeInTheDocument();
    expect(screen.getByText("Temporary demo workspaces")).toBeInTheDocument();
    expect(screen.getByText("Public demo path")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Out of scope" })).toBeInTheDocument();
    expect(screen.getByText("Billing and subscription management")).toBeInTheDocument();
    expect(screen.getByText("PUBLIC UI BASELINE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Implementation baseline" })).toBeInTheDocument();
    expect(
      screen.getByText("Reusable structure, readable states, and responsive layouts.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The public pages use reusable layout components, responsive behavior, readable contrast tokens, and keyboard-visible controls."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reusable public shell" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Responsive layouts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrast-aware tokens" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keyboard-visible controls" })).toBeInTheDocument();
    expect(screen.getByText("REVIEWER REFERENCES")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Project links for review." })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "paperbinder.danielmaratta.com" })
        .some((link) => link.getAttribute("href") === "https://paperbinder.danielmaratta.com")
    ).toBe(true);
    expect(screen.getByRole("link", { name: "danielmaratta.com" })).toHaveAttribute(
      "href",
      "https://danielmaratta.com"
    );
    expect(screen.getByRole("link", { name: "Canonical repository history" })).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder"
    );
    expect(screen.queryByText(/in progress/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/WCAG compliant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fully accessible/i)).not.toBeInTheDocument();
    expect(document.title).toBe("About PaperBinder | PaperBinder");
  });

  it("Should_RenderHostedFlagshipArticle_When_ArticleRouteLoads", async () => {
    renderRootRoute({
      route: "/articles/building-paperbinder-production-shaped-saas-demo"
    });

    expect(
      screen.getByRole("heading", { name: "Building PaperBinder: From AI-Generated Code to Shippable Software" })
    ).toBeInTheDocument();
    expect(screen.getByText("Architecture / SaaS demo / AI-assisted development")).toBeInTheDocument();
    expect(
      screen.getByText(
        "How architecture, documentation, testing, independent review, and human judgment turned AI-generated implementation into a production-shaped SaaS application."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Flagship article")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Article metadata")).getByText("Daniel Maratta")).toBeInTheDocument();
    expect(screen.getByText(flagshipArticle.readingTimeLabel)).toBeInTheDocument();
    expect(screen.getByText("V1.1.2 public artifact")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspect the product, source, and review guide." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review guide" })).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder/blob/main/review/README.md"
    );
    expect(screen.getByRole("navigation", { name: "Article sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Where AI Helped" })).toHaveAttribute("href", "#where-ai-helped");
    expectAnalyticsEvent(
      screen.getByRole("link", { name: "Where AI Helped" }),
      publicAnalyticsEventNames.articleSectionNav
    );
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("heading", { name: "Introduction" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What is PaperBinder, and why build it?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Five Major Categories of AI Work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Generation" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Today, LLMs have made it easier than ever to generate and modify large volumes of application code. However, the challenge is no longer obtaining functional output. Rather, it is turning that output into software that is reliable, coherent, secure, maintainable, and safe to operate."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "V1 execution plan" })).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder/blob/main/docs/archive/v1/checkpoints/execution-plan.md"
    );
    expect(screen.getByRole("link", { name: "ADR-0007" })).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder/blob/main/docs/90-adr/ADR-0007-persistence-stack-ef-core-migrations-dapper-runtime.md"
    );
    expect(screen.getByText(".gitignore")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Dependency diagram showing PaperBinder Domain and Application projects at the center, with Infrastructure, API, Worker, Web, and Migrations around them."
      })
    ).toHaveAttribute("src", "/presentation/dependency-architecture-diagram.svg");
    expect(
      screen.getByRole("img", {
        name: "Workflow diagram showing PaperBinder development moving from implementation through validation, audit, remediation, verification, and release acceptance."
      })
    ).toHaveAttribute("src", "/presentation/workflow-diagram.svg");
    expect(
      screen.getByRole("img", { name: "PaperBinder v1 public interface before the frontend redesign." })
    ).toHaveAttribute("src", "/presentation/before-redesign.png");
    expect(
      screen.getByRole("img", { name: "PaperBinder public interface after the v1.1 frontend redesign." })
    ).toHaveAttribute("src", "/presentation/after-redesign.png");
    expect(screen.getByText("Figure 1. PaperBinder solution structure.")).toBeInTheDocument();
    expect(screen.getByText("Figure 2. The process that governed most of PaperBinder's development.")).toBeInTheDocument();
    expect(screen.getByText("Figure 3. PaperBinder as it looked during v1.")).toBeInTheDocument();
    expect(screen.getByText("Figure 4. PaperBinder after the successful front-end rewrite.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Live demo" })[0]).toHaveAttribute(
      "href",
      "https://paperbinder.danielmaratta.com"
    );
    expect(screen.getAllByRole("link", { name: "Repository" })[0]).toHaveAttribute(
      "href",
      "https://github.com/daniel-maratta/paper-binder"
    );
    expect(screen.getByRole("heading", { name: "Review the running demo and the source history." })).toBeInTheDocument();
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://paperbinder.danielmaratta.com/articles/building-paperbinder-production-shaped-saas-demo"
    );
    expect(document.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "article");
    expect(document.querySelector("#paperbinder-flagship-article-jsonld")?.textContent).toContain(
      '"@type":"Article"'
    );
    expect(document.title).toBe("Building PaperBinder: From AI-Generated Code to Shippable Software | PaperBinder");
  });

  it("Should_RenderLegalIndex_FromDedicatedLegalCollection_When_LegalRouteLoads", () => {
    renderRootRoute({
      route: "/legal"
    });

    expect(screen.getByRole("heading", { level: 1, name: "Legal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PaperBinder legal notices" })).toBeInTheDocument();
    expect(screen.getByText("Effective date: August 17, 2026")).toBeInTheDocument();
    expect(
      screen.getByText(
        "PaperBinder is a public demonstration project and hiring portfolio piece operated by Daniel Maratta. It is not a production SaaS service. Do not use it for confidential, sensitive, regulated, proprietary, personal, medical, financial, credential, or otherwise important real business information."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("PaperBinder is not intended for children under 13.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Privacy Policy" }).some((link) => link.getAttribute("href") === "/privacy")).toBe(true);
    expect(screen.getAllByRole("link", { name: "Terms of Use" }).some((link) => link.getAttribute("href") === "/terms")).toBe(true);
    expect(screen.getAllByRole("link", { name: "Cookie Notice" }).some((link) => link.getAttribute("href") === "/cookies")).toBe(true);
    expect(screen.queryByRole("navigation", { name: "Article sections" })).not.toBeInTheDocument();
    expect(screen.queryByText("Project evidence")).not.toBeInTheDocument();
    expect(document.title).toBe("Legal | PaperBinder");
  });

  it("Should_RenderPrivacyPolicy_WithTemporaryWorkspaceRetentionBoundaries_When_PrivacyRouteLoads", () => {
    renderRootRoute({
      route: "/privacy"
    });

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Children" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Temporary workspace retention" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Demo workspaces are temporary and expire according to the lease period displayed in the application. When a workspace expires, PaperBinder terminates access to that workspace."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Expiration is not the same as deletion. Workspace data may remain in PaperBinder's systems after expiration until automated cleanup removes it. Deletion timing can vary and may be affected by recent authenticated activity, operational failures, and host maintenance."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/GoatCounter receives basic analytics requests from visitors' browsers/i)).toBeInTheDocument();
    expect(screen.getByText("PaperBinder does not sell personal information.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "paperbinder@danielmaratta.com" })).toHaveAttribute(
      "href",
      "mailto:paperbinder@danielmaratta.com"
    );
    expect(screen.queryByText(/60-minute/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/static review/i)).not.toBeInTheDocument();
    expect(document.title).toBe("Privacy Policy | PaperBinder");
  });

  it("Should_ResetViewportToTop_When_PublicRouteChanges", async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo
    });

    renderRootRoute({
      route: "/privacy"
    });
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "Terms of Use" }));

    expect(await screen.findByRole("heading", { name: "Terms of Use" })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  });

  it("Should_RenderTermsOfUse_WithDemoOnlyAndTennesseeTerms_When_TermsRouteLoads", () => {
    renderRootRoute({
      route: "/terms"
    });

    expect(screen.getByRole("heading", { name: "Terms of Use" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demo-only use" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Acceptance of these terms" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Children" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "PaperBinder is a public demonstration project and hiring portfolio piece operated by Daniel Maratta. It is not a production SaaS service, commercial service, storage service, document-management service, backup service, or compliance platform."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("By creating or using a demo workspace, you agree to these terms.")).toBeInTheDocument();
    expect(screen.getByText("There are no backup, restoration, recovery, continuity, availability, or support guarantees.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Prohibited conduct" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "These terms are governed by Tennessee law, without regard to conflict-of-law rules. Any dispute must be brought in a Tennessee state or federal court with appropriate jurisdiction, unless applicable law requires otherwise."
      )
    ).toBeInTheDocument();
    expect(document.title).toBe("Terms of Use | PaperBinder");
  });

  it("Should_RenderCookieNotice_WithStrictlyNecessaryCookieDisclosure_When_CookiesRouteLoads", () => {
    renderRootRoute({
      route: "/cookies"
    });

    expect(screen.getByRole("heading", { name: "Cookie Notice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cookie use" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Telemetry" })).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) =>
        element?.tagName === "P" &&
        element.textContent ===
          "This Cookie Notice explains how the PaperBinder public demo uses cookies and browser storage. PaperBinder's only cookies are strictly necessary authentication and CSRF cookies. PaperBinder also uses GoatCounter for basic analytics without analytics cookies, advertising cookies, localStorage, or sessionStorage. PaperBinder does not use marketing analytics or advertising cookies."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("An authentication cookie used to keep a user signed in to a temporary workspace. This cookie is HttpOnly and server-readable.")).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) =>
        element?.textContent ===
        "PaperBinder does not store its data in your browser's localStorage or sessionStorage."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/basic aggregate usage analytics through GoatCounter without analytics cookies/i)).toBeInTheDocument();
    expect(screen.queryByText(/static review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/accept cookies/i)).not.toBeInTheDocument();
    expect(document.title).toBe("Cookie Notice | PaperBinder");
  });

  it("Should_CollapseArticleSections_When_ArticleRouteRendersBelowDesktopNavigationWidth", () => {
    installMatchMediaStub(false);

    renderRootRoute({
      route: "/articles/building-paperbinder-production-shaped-saas-demo"
    });

    const sectionsToggle = screen.getByRole("button", { name: /Sections/ });
    expect(sectionsToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Where AI Helped" })).not.toBeInTheDocument();

    fireEvent.click(sectionsToggle);

    expect(sectionsToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("link", { name: "Where AI Helped" })).toHaveAttribute("href", "#where-ai-helped");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(sectionsToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Where AI Helped" })).not.toBeInTheDocument();

    fireEvent.click(sectionsToggle);

    expect(sectionsToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerDown(document.body);

    expect(sectionsToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Where AI Helped" })).not.toBeInTheDocument();
  });

  it("Should_LinkBackToWorkspace_When_PublicHomeReceivesWorkspaceHint", async () => {
    renderRootRoute({
      route: "/?workspace=acme"
    });

    expect(screen.getByRole("link", { name: "Open Workspace" })).toHaveAttribute(
      "href",
      "https://acme.paperbinder.example.test/app"
    );
    expect(screen.getByRole("link", { name: "Open workspace" })).toHaveAttribute(
      "href",
      "https://acme.paperbinder.example.test/app"
    );
  });

  it("Should_SubmitProvisionRequest_WithTenantNameAndChallengeToken_When_RootHostProvisionFormIsValid", async () => {
    installTurnstileStub();
    const provisionMock = vi.fn(async () => createProvisionResponse());

    renderRootRoute({
      route: "/start-demo",
      apiClient: createApiClientStub({
        provision: provisionMock as PaperBinderApiClient["provision"]
      })
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: " Acme Demo " }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await waitFor(() =>
      expect(provisionMock).toHaveBeenCalledWith({
        tenantName: "Acme Demo",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );

    expect(await screen.findByDisplayValue("owner@acme-demo.local")).toBeInTheDocument();
  });

  it("Should_ShowProvisionedCredentialsOnce_AndRedirectUsingServerProvidedUrl_When_ProvisionSucceeds", async () => {
    installTurnstileStub();
    const navigator = vi.fn();

    renderRootRoute({
      route: "/start-demo",
      navigator
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    expect(await screen.findByRole("heading", { name: "Workspace ready." })).toBeInTheDocument();
    expect(navigator).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open workspace" }));
    expect(navigator).toHaveBeenCalledWith("https://acme-demo.paperbinder.example.test/app");
  });

  it("Should_CopyProvisionedTenantValues_When_CopyActionsAreUsed", async () => {
    installTurnstileStub();
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });

    renderRootRoute({
      route: "/start-demo"
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await screen.findByRole("heading", { name: "Workspace ready." });

    fireEvent.click(screen.getByRole("button", { name: "Copy email" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("owner@acme-demo.local"));

    fireEvent.click(screen.getByRole("button", { name: "Copy password" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("generated-password"));

    fireEvent.click(screen.getByRole("button", { name: "Copy workspace slug" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("acme-demo"));
  });

  it("Should_MaskProvisionedPasswordUntilReveal_When_PublicCredentialHandoffRenders", async () => {
    installTurnstileStub();

    renderRootRoute({
      route: "/start-demo"
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await screen.findByRole("heading", { name: "Workspace ready." });

    const passwordField = screen.getByLabelText("Password") as HTMLInputElement;
    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordField).toHaveValue("generated-password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordField).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordField).toHaveAttribute("type", "password");
  });

  it("Should_ClearProvisionedCredentials_When_PageIsRestoredFromBackForwardCache", async () => {
    installTurnstileStub();

    renderRootRoute({
      route: "/start-demo"
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await screen.findByRole("heading", { name: "Workspace ready." });

    const pageShowEvent = new Event("pageshow");
    Object.defineProperty(pageShowEvent, "persisted", {
      configurable: true,
      value: true
    });
    window.dispatchEvent(pageShowEvent);

    expect(await screen.findByRole("heading", { name: "Start demo" })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("generated-password")).not.toBeInTheDocument();
  });

  it("Should_ClearLoginPassword_When_PageIsRestoredFromBackForwardCache", async () => {
    renderRootRoute({
      route: "/login",
      challengeLocalBypassEnabled: true
    });

    const passwordField = screen.getByLabelText("Password") as HTMLInputElement;
    fireEvent.change(passwordField, {
      target: { value: "generated-password" }
    });

    const pageShowEvent = new Event("pageshow");
    Object.defineProperty(pageShowEvent, "persisted", {
      configurable: true,
      value: true
    });
    window.dispatchEvent(pageShowEvent);

    await waitFor(() => {
      expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
    });
  });

  it("Should_ProvisionOrLogin_FromStartDemoFlow_When_ChallengeAndServerRedirectsSucceed", async () => {
    installTurnstileStub();
    const provisionMock = vi.fn(async () => createProvisionResponse());

    renderRootRoute({
      route: "/start-demo",
      apiClient: createApiClientStub({
        provision: provisionMock as PaperBinderApiClient["provision"]
      })
    });

    expect(await screen.findByRole("heading", { name: "Start demo" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Go to sign in" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByRole("heading", { name: "Already have demo credentials?" })).toBeInTheDocument();
    expect(
      screen.getByText("Return to a workspace you already created with the email and password issued during setup.")
    ).toBeInTheDocument();
    expect(screen.getByText("WHAT HAPPENS NEXT")).toBeInTheDocument();
    expect(screen.getByText("Only the workspace name and security challenge are submitted here.")).toBeInTheDocument();
    expect(
      screen.getByText("Generated credentials are shown before entering the workspace.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("PaperBinder opens the new workspace after setup completes.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Demo workspaces are temporary and removed during cleanup.")
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demo data warning" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Do not submit confidential, sensitive, regulated, proprietary, personal, medical, financial, credential, or important real business information."
      )
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await waitFor(() =>
      expect(provisionMock).toHaveBeenCalledWith({
        tenantName: "Acme Demo",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );
    expect(await screen.findByRole("heading", { name: "Workspace ready." })).toBeInTheDocument();
  });

  it("Should_RenderIntentionalChallengeFallback_When_ChallengeScriptCannotLoad", async () => {
    renderRootRoute({
      route: "/start-demo"
    });

    await waitFor(() => {
      expect(document.querySelector(`script[src="${testEnvironment.challengeScriptUrl}"]`)).not.toBeNull();
    });

    expect(screen.getAllByText("Security challenge loading...")).toHaveLength(1);
    expect(screen.getByText("Complete the security challenge before starting a workspace.")).toBeInTheDocument();

    document
      .querySelector(`script[src="${testEnvironment.challengeScriptUrl}"]`)!
      .dispatchEvent(new Event("error"));

    expect(await screen.findByText("Challenge unavailable")).toBeInTheDocument();
    expect(
      screen.getAllByText("The challenge widget could not be loaded. Refresh and try again.").length
    ).toBeGreaterThan(0);
  });

  it("Should_SubmitLoginRequest_AndRedirectUsingServerProvidedUrl_When_RootHostLoginSucceeds", async () => {
    installTurnstileStub();
    const loginMock = vi.fn(async () => ({
      redirectUrl: "https://acme-demo.paperbinder.example.test/app"
    }));
    const navigator = vi.fn();

    renderRootRoute({
      route: "/login",
      navigator,
      apiClient: createApiClientStub({
        login: loginMock as PaperBinderApiClient["login"]
      })
    });

    expect(screen.getByRole("heading", { name: "Start with a fresh demo workspace." })).toBeInTheDocument();
    expect(
      screen.getByText("Create a temporary workspace and continue with generated credentials.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start demo instead" })).toHaveAttribute("href", "/start-demo");
    expect(screen.getByText("HOW SIGN-IN WORKS")).toBeInTheDocument();
    expect(screen.getAllByText("Complete the security challenge before signing in.").length).toBeGreaterThan(0);
    expect(screen.queryByText(/unless local bypass is enabled/i)).not.toBeInTheDocument();
    expect(screen.getByText("If sign-in fails, complete the challenge again before retrying.")).toBeInTheDocument();
    expect(screen.getByText("After sign-in, PaperBinder sends you to the matching workspace.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "generated-password" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "owner@acme-demo.local",
        password: "generated-password",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );
    await waitFor(() =>
      expect(navigator).toHaveBeenCalledWith("https://acme-demo.paperbinder.example.test/app")
    );
  });

  it("Should_RenderSafeRootHostErrors_When_ProvisionOrLoginReturnsProblemDetails", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText
      }
    });

    installTurnstileStub();
    const error = new PaperBinderApiError({
      message: "Conflict",
      status: 409,
      errorCode: "TENANT_NAME_CONFLICT",
      detail: "That workspace name is already in use.",
      correlationId: "corr-conflict",
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });

    renderRootRoute({
      route: "/start-demo",
      apiClient: createApiClientStub({
        provision: vi.fn(async () => {
          throw error;
        }) as PaperBinderApiClient["provision"]
      })
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    expect(await screen.findByRole("heading", { name: "Workspace name already exists." })).toBeInTheDocument();
    expect(screen.getAllByText("Choose a different workspace name and retry.")).toHaveLength(2);
    expect(screen.getByText(/corr-conflict/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy correlation id" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("corr-conflict"));
  });

  it("Should_ResetChallengeState_When_PreAuthSubmissionFails_AndRetryIsAllowed", async () => {
    const turnstile = installTurnstileStub();
    const loginMock = vi.fn(async () => {
      throw new PaperBinderApiError({
        message: "Invalid credentials",
        status: 401,
        errorCode: "INVALID_CREDENTIALS",
        detail: "The supplied email or password is invalid.",
        correlationId: "corr-invalid",
        retryAfterSeconds: null,
        traceId: null,
        validationErrors: null
      });
    });

    renderRootRoute({
      route: "/login",
      apiClient: createApiClientStub({
        login: loginMock as PaperBinderApiClient["login"]
      })
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await screen.findByRole("heading", { name: "Credentials were not accepted." });
    await waitFor(() => expect(turnstile.resetMock).toHaveBeenCalledTimes(1));
  });

  it("Should_SubmitFixedBypassToken_When_LocalChallengeBypassIsEnabled", async () => {
    const provisionMock = vi.fn(async () => createProvisionResponse());

    renderRootRoute({
      route: "/start-demo",
      challengeLocalBypassEnabled: true,
      apiClient: createApiClientStub({
        provision: provisionMock as PaperBinderApiClient["provision"]
      })
    });

    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: " Acme Demo " }
    });
    expect(screen.getByRole("heading", { name: "Local challenge bypass enabled" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Challenge")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start demo workspace" }));

    await waitFor(() =>
      expect(provisionMock).toHaveBeenCalledWith({
        tenantName: "Acme Demo",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );

    expect(await screen.findByRole("heading", { name: "Workspace ready." })).toBeInTheDocument();
  });
});
