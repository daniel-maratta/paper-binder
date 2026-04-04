using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using PaperBinder.Api;

namespace PaperBinder.UnitTests;

public sealed class HttpContractHelperTests
{
    [Theory]
    [InlineData("/api")]
    [InlineData("/api/contracts")]
    [InlineData("/api/contracts/probe")]
    public void ApiRequestClassifier_Should_MatchApiPaths(string path)
    {
        Assert.True(PaperBinderApiRequestClassifier.IsApiRequest(new PathString(path)));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/app")]
    [InlineData("/apix")]
    [InlineData("/health/live")]
    public void ApiRequestClassifier_Should_RejectNonApiPaths(string path)
    {
        Assert.False(PaperBinderApiRequestClassifier.IsApiRequest(new PathString(path)));
    }

    [Fact]
    public void ApiVersioning_Should_DefaultToCurrentVersion_When_HeaderIsMissing()
    {
        var result = PaperBinderApiVersioning.TryResolveRequestedVersion(StringValues.Empty, out var version);

        Assert.True(result);
        Assert.Equal(PaperBinderApiVersioning.CurrentVersion, version);
    }

    [Theory]
    [InlineData("1")]
    [InlineData(" 1 ")]
    public void ApiVersioning_Should_AcceptSupportedVersion(string requestedVersion)
    {
        var result = PaperBinderApiVersioning.TryResolveRequestedVersion(
            new StringValues(requestedVersion),
            out var version);

        Assert.True(result);
        Assert.Equal(PaperBinderApiVersioning.CurrentVersion, version);
    }

    [Theory]
    [InlineData("2")]
    [InlineData("abc")]
    [InlineData("01")]
    public void ApiVersioning_Should_RejectUnsupportedOrMalformedVersion(string requestedVersion)
    {
        var result = PaperBinderApiVersioning.TryResolveRequestedVersion(
            new StringValues(requestedVersion),
            out _);

        Assert.False(result);
    }

    [Fact]
    public void ApiVersioning_Should_RejectMultipleHeaderValues()
    {
        var result = PaperBinderApiVersioning.TryResolveRequestedVersion(
            new StringValues(["1", "2"]),
            out _);

        Assert.False(result);
    }

    [Theory]
    [InlineData("review-id")]
    [InlineData("2d53bb7c6eb74d4ea5046864f4c1ae16")]
    [InlineData("uuid-like-1234-5678")]
    public void CorrelationValidator_Should_AcceptVisibleAsciiTokens(string candidate)
    {
        var result = PaperBinderRequestCorrelation.TryGetValidClientValue(
            new StringValues(candidate),
            out var correlationId);

        Assert.True(result);
        Assert.Equal(candidate, correlationId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("contains space")]
    [InlineData("contains,comma")]
    [InlineData("snowman-\u2603")]
    public void CorrelationValidator_Should_RejectInvalidValues(string candidate)
    {
        var result = PaperBinderRequestCorrelation.TryGetValidClientValue(
            new StringValues(candidate),
            out _);

        Assert.False(result);
    }

    [Fact]
    public void CorrelationValidator_Should_RejectMultipleHeaderValues()
    {
        var result = PaperBinderRequestCorrelation.TryGetValidClientValue(
            new StringValues(["one", "two"]),
            out _);

        Assert.False(result);
    }

    [Fact]
    public void CorrelationValidator_Should_RejectValuesLongerThan64Characters()
    {
        var candidate = new string('a', 65);

        var result = PaperBinderRequestCorrelation.TryGetValidClientValue(
            new StringValues(candidate),
            out _);

        Assert.False(result);
    }

    [Fact]
    public void TenantRedirectUrlBuilder_Should_BuildTenantAppUrlFromPublicRoot()
    {
        var redirectUrl = PaperBinderTenantRedirectUrlBuilder.Build(
            new Uri("https://paperbinder.example.test:8443/"),
            "acme");

        Assert.Equal("https://acme.paperbinder.example.test:8443/app", redirectUrl.ToString());
    }

    [Fact]
    public void CsrfProtection_Should_AcceptMatchingCookieAndHeaderValues()
    {
        var token = "ABC123";

        var result = PaperBinderCsrfProtection.IsValid(token, new StringValues(token));

        Assert.True(result);
    }

    [Fact]
    public void CsrfProtection_Should_RejectMissingOrMismatchedValues()
    {
        Assert.False(PaperBinderCsrfProtection.IsValid(null, new StringValues("abc")));
        Assert.False(PaperBinderCsrfProtection.IsValid("abc", StringValues.Empty));
        Assert.False(PaperBinderCsrfProtection.IsValid("abc", new StringValues("xyz")));
    }

    [Fact]
    public void AuthEndpointHostPolicy_Should_RequireSystemHostForLoginAndTenantHostForLogout()
    {
        var systemHost = new TestResolvedTenantHostContext(isSystemHost: true, tenantHost: null);
        var tenantHost = new TestResolvedTenantHostContext(
            isSystemHost: false,
            tenantHost: new PaperBinder.Application.Tenancy.ResolvedTenantHost(
                new PaperBinder.Application.Tenancy.TenantContext(Guid.NewGuid(), "demo", "Demo"),
                DateTimeOffset.UtcNow.AddMinutes(5)));

        Assert.True(PaperBinderAuthEndpointHostPolicy.AllowsLogin(systemHost));
        Assert.False(PaperBinderAuthEndpointHostPolicy.AllowsLogin(tenantHost));
        Assert.False(PaperBinderAuthEndpointHostPolicy.AllowsLogout(systemHost));
        Assert.True(PaperBinderAuthEndpointHostPolicy.AllowsLogout(tenantHost));
    }

    [Fact]
    public void AuthenticatedUserHelper_Should_ParseGuidNameIdentifier()
    {
        var userId = Guid.NewGuid();
        var principal = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(
                [new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId.ToString("D"))],
                "test"));

        var result = PaperBinderAuthenticatedUser.TryGetUserId(principal, out var parsedUserId);

        Assert.True(result);
        Assert.Equal(userId, parsedUserId);
    }

    private sealed class TestResolvedTenantHostContext(
        bool isSystemHost,
        PaperBinder.Application.Tenancy.ResolvedTenantHost? tenantHost) : IRequestResolvedTenantHostContext
    {
        public bool IsEstablished => isSystemHost || tenantHost is not null;

        public bool IsSystemHost => isSystemHost;

        public bool IsTenantHost => tenantHost is not null;

        public PaperBinder.Application.Tenancy.ResolvedTenantHost? TenantHost => tenantHost;
    }
}
