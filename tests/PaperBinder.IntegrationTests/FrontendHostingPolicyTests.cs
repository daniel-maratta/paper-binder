using Microsoft.Extensions.Hosting;
using PaperBinder.Api;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class FrontendHostingPolicyTests
{
    [Fact]
    public void DevelopmentEnvironment_DoesNotServeCompiledFrontend()
    {
        var shouldServe = FrontendHostingPolicy.ShouldServeCompiledFrontend(
            Environments.Development,
            hasFrontendEntryPoint: true);

        Assert.False(shouldServe);
    }

    [Fact]
    public void ExplicitCompiledMode_ServesCompiledFrontend_InDevelopment()
    {
        var shouldServe = FrontendHostingPolicy.ShouldServeCompiledFrontend(
            Environments.Development,
            hasFrontendEntryPoint: true,
            FrontendHostingPolicy.CompiledHostingMode);

        Assert.True(shouldServe);
    }

    [Fact]
    public void NonDevelopmentEnvironment_ServesCompiledFrontend_WhenEntryPointExists()
    {
        var shouldServe = FrontendHostingPolicy.ShouldServeCompiledFrontend(
            Environments.Production,
            hasFrontendEntryPoint: true);

        Assert.True(shouldServe);
    }

    [Fact]
    public void MissingEntryPoint_DoesNotServeCompiledFrontend()
    {
        var shouldServe = FrontendHostingPolicy.ShouldServeCompiledFrontend(
            Environments.Production,
            hasFrontendEntryPoint: false);

        Assert.False(shouldServe);
    }

    [Fact]
    public void BackendLandingPage_RendersBackendLiveState()
    {
        var html = BackendLandingPage.Render(Environments.Development);

        Assert.Contains("PaperBinder API is running.", html);
        Assert.Contains("Backend Host Live", html);
        Assert.Contains("backend-process live-state page", html);
        Assert.Contains(Environments.Development, html);
    }

    [Fact]
    public void FlagshipArticleFrontendHtml_RendersArticleMetadataInInitialHtml()
    {
        const string frontendHtml = """
            <html>
              <head>
                <title>PaperBinder | Secure multi-tenant document workspace</title>
                <meta name="description" content="Generic app description." />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="PaperBinder" />
                <meta property="og:description" content="Generic Open Graph description." />
                <meta property="og:image" content="/brand/pb-full-logo-color.png" />
                <script type="application/ld+json">
                  {"@context":"https://schema.org","@type":"SoftwareApplication","name":"PaperBinder"}
                </script>
              </head>
              <body><div id="root"></div></body>
            </html>
            """;

        var html = FlagshipArticleFrontendHtml.Render(frontendHtml);

        Assert.Contains(
            "<title>Building PaperBinder: From AI-Generated Code to Shippable Software | PaperBinder</title>",
            html);
        Assert.Contains("""<meta property="og:type" content="article" />""", html);
        Assert.Contains(
            """<link rel="canonical" href="https://paperbinder.danielmaratta.com/articles/building-paperbinder-production-shaped-saas-demo" />""",
            html);
        Assert.Contains("""<meta name="twitter:card" content="summary_large_image" />""", html);
        Assert.Contains("""<meta property="og:image" content="https://paperbinder.danielmaratta.com/presentation/after-redesign.png" />""", html);
        Assert.Contains("""<script id="paperbinder-flagship-article-jsonld" type="application/ld+json">""", html);
        Assert.Contains(""""@type":"Article"""", html);
        Assert.DoesNotContain("SoftwareApplication", html);
    }
}
