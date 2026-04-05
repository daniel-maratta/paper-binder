using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal sealed class TurnstileChallengeVerificationService : IChallengeVerificationService
{
    private static readonly Uri SiteVerifyUri = new("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    private readonly HttpClient httpClient;
    private readonly PaperBinderRuntimeSettings runtimeSettings;
    private readonly Func<string, string?> getEnvironmentVariable;
    private readonly ILogger<TurnstileChallengeVerificationService> logger;

    public TurnstileChallengeVerificationService(
        HttpClient httpClient,
        PaperBinderRuntimeSettings runtimeSettings,
        ILogger<TurnstileChallengeVerificationService> logger)
        : this(httpClient, runtimeSettings, Environment.GetEnvironmentVariable, logger)
    {
    }

    internal TurnstileChallengeVerificationService(
        HttpClient httpClient,
        PaperBinderRuntimeSettings runtimeSettings,
        Func<string, string?> getEnvironmentVariable,
        ILogger<TurnstileChallengeVerificationService> logger)
    {
        this.httpClient = httpClient;
        this.runtimeSettings = runtimeSettings;
        this.getEnvironmentVariable = getEnvironmentVariable;
        this.logger = logger;
    }

    public async Task<bool> VerifyAsync(
        string challengeToken,
        IPAddress? remoteIpAddress,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(challengeToken);

        if (PaperBinderChallengeVerification.AllowsTestBypass(challengeToken, getEnvironmentVariable))
        {
            return true;
        }

        using var response = await PostVerificationRequestAsync(challengeToken, remoteIpAddress, cancellationToken);
        if (response is null || !response.IsSuccessStatusCode)
        {
            if (response is not null)
            {
                logger.LogWarning(
                    "Challenge verification failed with a non-success response. Provider=Turnstile StatusCode={StatusCode} RemoteIp={RemoteIp}",
                    (int)response.StatusCode,
                    remoteIpAddress?.ToString() ?? "unknown");
            }

            return false;
        }

        try
        {
            var payload = await response.Content.ReadFromJsonAsync<TurnstileVerificationResponse>(
                cancellationToken: cancellationToken);

            if (payload?.Success == true)
            {
                return true;
            }

            logger.LogWarning(
                "Challenge verification was rejected by the provider. Provider=Turnstile RemoteIp={RemoteIp}",
                remoteIpAddress?.ToString() ?? "unknown");
            return false;
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Challenge verification returned an unreadable payload. Provider=Turnstile RemoteIp={RemoteIp}",
                remoteIpAddress?.ToString() ?? "unknown");
            return false;
        }
        catch (NotSupportedException ex)
        {
            logger.LogWarning(
                ex,
                "Challenge verification returned an unsupported payload. Provider=Turnstile RemoteIp={RemoteIp}",
                remoteIpAddress?.ToString() ?? "unknown");
            return false;
        }
    }

    private async Task<HttpResponseMessage?> PostVerificationRequestAsync(
        string challengeToken,
        IPAddress? remoteIpAddress,
        CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, SiteVerifyUri)
            {
                Content = new FormUrlEncodedContent(BuildRequestFields(challengeToken, remoteIpAddress))
            };

            return await httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(
                ex,
                "Challenge verification request failed before a provider response was received. Provider=Turnstile RemoteIp={RemoteIp}",
                remoteIpAddress?.ToString() ?? "unknown");
            return null;
        }
    }

    private IEnumerable<KeyValuePair<string, string>> BuildRequestFields(
        string challengeToken,
        IPAddress? remoteIpAddress)
    {
        yield return new KeyValuePair<string, string>("secret", runtimeSettings.Challenge.SecretKey);
        yield return new KeyValuePair<string, string>("response", challengeToken);

        if (remoteIpAddress is not null)
        {
            yield return new KeyValuePair<string, string>("remoteip", remoteIpAddress.ToString());
        }
    }

    private sealed record TurnstileVerificationResponse(
        bool Success);
}
