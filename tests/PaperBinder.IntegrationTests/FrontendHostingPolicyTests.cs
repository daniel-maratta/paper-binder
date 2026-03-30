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
    public void BackendLandingPage_RendersReviewerFacingLiveState()
    {
        var html = BackendLandingPage.Render(Environments.Development);

        Assert.Contains("PaperBinder API is running.", html);
        Assert.Contains("Backend Host Live", html);
        Assert.Contains(Environments.Development, html);
    }
}
