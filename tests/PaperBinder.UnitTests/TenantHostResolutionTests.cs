using PaperBinder.Api;

namespace PaperBinder.UnitTests;

public sealed class TenantHostResolutionTests
{
    [Theory]
    [InlineData(".paperbinder.localhost", "paperbinder.localhost")]
    [InlineData("paperbinder.localhost", "paperbinder.localhost")]
    public void Should_TreatConfiguredBaseDomainAsSystemHost(string configuredDomain, string requestHost)
    {
        var result = PaperBinderTenantHostResolution.Resolve(configuredDomain, requestHost, allowLoopbackHosts: false);

        Assert.Equal(PaperBinderTenantHostMatchKind.System, result.Kind);
        Assert.Null(result.TenantSlug);
    }

    [Theory]
    [InlineData("localhost")]
    [InlineData("127.0.0.1")]
    [InlineData("::1")]
    public void Should_TreatLoopbackHostsAsSystemContext_When_Allowed(string requestHost)
    {
        var result = PaperBinderTenantHostResolution.Resolve(
            ".paperbinder.localhost",
            requestHost,
            allowLoopbackHosts: true);

        Assert.Equal(PaperBinderTenantHostMatchKind.System, result.Kind);
        Assert.Null(result.TenantSlug);
    }

    [Theory]
    [InlineData("demo.paperbinder.localhost", "demo")]
    [InlineData("Review-Path.paperbinder.localhost", "review-path")]
    public void Should_ResolveTenantSlugFromSingleSubdomainHost(string requestHost, string expectedTenantSlug)
    {
        var result = PaperBinderTenantHostResolution.Resolve(
            ".paperbinder.localhost",
            requestHost,
            allowLoopbackHosts: false);

        Assert.Equal(PaperBinderTenantHostMatchKind.Tenant, result.Kind);
        Assert.Equal(expectedTenantSlug, result.TenantSlug);
    }

    [Theory]
    [InlineData("")]
    [InlineData("tenant.otherhost.local")]
    [InlineData("foo.bar.paperbinder.localhost")]
    [InlineData("-tenant.paperbinder.localhost")]
    [InlineData("tenant-.paperbinder.localhost")]
    [InlineData("tenant_name.paperbinder.localhost")]
    public void Should_RejectHostsThatDoNotMatchTenantRoutingRules(string requestHost)
    {
        var result = PaperBinderTenantHostResolution.Resolve(
            ".paperbinder.localhost",
            requestHost,
            allowLoopbackHosts: false);

        Assert.Equal(PaperBinderTenantHostMatchKind.Invalid, result.Kind);
        Assert.Null(result.TenantSlug);
    }

    [Fact]
    public void RequestTenantContext_Should_RejectSecondEstablishment()
    {
        var context = new PaperBinderTenantRequestContext();

        context.EstablishSystem();

        var ex = Assert.Throws<InvalidOperationException>(() => context.EstablishSystem());
        Assert.Equal("The request tenant context can only be established once per request.", ex.Message);
    }

    [Fact]
    public void TenantHostFailurePage_Should_HtmlEncodeInterpolatedValues()
    {
        var html = TenantHostFailurePage.Render(
            "<script>alert('xss')</script>",
            "detail with <b>markup</b> & more");

        Assert.Contains("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;", html);
        Assert.Contains("detail with &lt;b&gt;markup&lt;/b&gt; &amp; more", html);
        Assert.DoesNotContain("<script>alert('xss')</script>", html);
        Assert.DoesNotContain("detail with <b>markup</b> & more", html);
    }
}
