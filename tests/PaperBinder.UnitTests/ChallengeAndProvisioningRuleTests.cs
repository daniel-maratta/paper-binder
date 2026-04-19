using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Logging.Abstractions;
using PaperBinder.Api;
using PaperBinder.Application.Provisioning;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.UnitTests;

public sealed class ChallengeAndProvisioningRuleTests
{
    [Fact]
    public void ChallengeVerification_Should_OnlyAllowFixedBypassToken_When_PbEnvIsTest()
    {
        var bypassEnabled = PaperBinderChallengeVerification.AllowsTestBypass(
            PaperBinderChallengeVerification.TestBypassToken,
            key => key == PaperBinderChallengeVerification.TestEnvironmentVariableName
                ? PaperBinderChallengeVerification.TestEnvironmentValue
                : null);

        var bypassDisabledInOtherEnvironment = PaperBinderChallengeVerification.AllowsTestBypass(
            PaperBinderChallengeVerification.TestBypassToken,
            _ => "Development");

        var bypassDisabledForWrongToken = PaperBinderChallengeVerification.AllowsTestBypass(
            "wrong-token",
            _ => PaperBinderChallengeVerification.TestEnvironmentValue);

        Assert.True(bypassEnabled);
        Assert.False(bypassDisabledInOtherEnvironment);
        Assert.False(bypassDisabledForWrongToken);
    }

    [Fact]
    public async Task ChallengeVerificationService_Should_DelegateToTurnstile_When_TestBypassIsNotEnabled()
    {
        var invocationCount = 0;
        var handler = new TestHttpMessageHandler(async request =>
        {
            invocationCount++;

            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal("https://challenges.cloudflare.com/turnstile/v0/siteverify", request.RequestUri!.ToString());

            var body = await request.Content!.ReadAsStringAsync();
            Assert.Contains("secret=local-demo-secret-key", body);
            Assert.Contains("response=client-token", body);
            Assert.Contains("remoteip=127.0.0.1", body);

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(new { success = true })
            };
        });

        var service = new TurnstileChallengeVerificationService(
            new HttpClient(handler),
            CreateRuntimeSettings(),
            _ => "Development",
            NullLogger<TurnstileChallengeVerificationService>.Instance);

        var result = await service.VerifyAsync("client-token", IPAddress.Parse("127.0.0.1"));

        Assert.True(result);
        Assert.Equal(1, invocationCount);
    }

    [Fact]
    public void TenantProvisioningRules_Should_NormalizeTenantNameIntoSlug()
    {
        var success = TenantProvisioningRules.TryNormalizeTenantName(
            "  Acmé Demo 2026!!!  ",
            out var normalized);

        Assert.True(success);
        Assert.NotNull(normalized);
        Assert.Equal("Acmé Demo 2026!!!", normalized!.TenantName);
        Assert.Equal("acme-demo-2026", normalized.TenantSlug);
    }

    [Fact]
    public void TenantProvisioningRules_Should_RejectNamesThatDoNotProduceASlug()
    {
        var success = TenantProvisioningRules.TryNormalizeTenantName("!!!", out var normalized);

        Assert.False(success);
        Assert.Null(normalized);
    }

    [Fact]
    public void TenantProvisioningRules_Should_CapGeneratedSlugLengthAt63Characters()
    {
        var success = TenantProvisioningRules.TryNormalizeTenantName(
            new string('a', 80),
            out var normalized);

        Assert.True(success);
        Assert.NotNull(normalized);
        Assert.Equal(TenantProvisioningRules.MaxTenantSlugLength, normalized!.TenantSlug.Length);
    }

    [Fact]
    public void TenantProvisioningRules_Should_GenerateStrongOneTimePasswords()
    {
        var password = TenantProvisioningRules.GenerateOneTimePassword();

        Assert.Equal(TenantProvisioningRules.GeneratedPasswordLength, password.Length);
        Assert.Contains(password, char.IsLower);
        Assert.Contains(password, char.IsUpper);
        Assert.Contains(password, char.IsDigit);
        Assert.All(password, character => Assert.True(char.IsLetterOrDigit(character)));
    }

    private static PaperBinderRuntimeSettings CreateRuntimeSettings() =>
        new(
            new DatabaseSettings(
                "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password",
                "localhost",
                5432),
            new PublicUrlSettings(new Uri("http://paperbinder.localhost:8080")),
            new AuthCookieSettings(".paperbinder.localhost", "paperbinder.auth", "paperbinder-local-keys"),
            new ChallengeSettings("local-demo-site-key", "local-demo-secret-key"),
            new LeaseSettings(60, 10, 3, 60),
            new RateLimitSettings(30, 120, 10),
            new AuditSettings(AuditRetentionMode.RetainTenantPurgedSummary),
            new ObservabilitySettings(null));

    private sealed class TestHttpMessageHandler(
        Func<HttpRequestMessage, Task<HttpResponseMessage>> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => handler(request);
    }
}
