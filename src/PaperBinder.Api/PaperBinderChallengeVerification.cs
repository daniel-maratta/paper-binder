using System.Net;

namespace PaperBinder.Api;

internal interface IChallengeVerificationService
{
    Task<bool> VerifyAsync(
        string challengeToken,
        IPAddress? remoteIpAddress,
        CancellationToken cancellationToken = default);
}

internal static class PaperBinderChallengeVerification
{
    public const string TestEnvironmentVariableName = "PB_ENV";
    public const string TestEnvironmentValue = "Test";
    public const string TestBypassToken = "paperbinder-test-challenge-pass";

    public static bool AllowsTestBypass(string challengeToken) =>
        AllowsTestBypass(challengeToken, Environment.GetEnvironmentVariable);

    internal static bool AllowsTestBypass(
        string challengeToken,
        Func<string, string?> getEnvironmentVariable)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(challengeToken);
        ArgumentNullException.ThrowIfNull(getEnvironmentVariable);

        var environmentValue = getEnvironmentVariable(TestEnvironmentVariableName);
        return string.Equals(environmentValue, TestEnvironmentValue, StringComparison.OrdinalIgnoreCase) &&
               string.Equals(challengeToken, TestBypassToken, StringComparison.Ordinal);
    }
}
