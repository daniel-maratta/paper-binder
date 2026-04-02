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
}
