using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class RuntimeConfigurationTests
{
    [Fact]
    public void Should_LoadTypedRuntimeConfiguration_When_AllRequiredKeysArePresent()
    {
        var configuration = TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password");

        var settings = PaperBinderRuntimeSettings.Load(
            key => configuration.TryGetValue(key, out var value) ? value : null);

        Assert.Equal("localhost", settings.Database.Host);
        Assert.Equal(5432, settings.Database.Port);
        Assert.Equal("http://paperbinder.localhost:8080/", settings.PublicUrl.RootUrl.ToString());
        Assert.Equal(".paperbinder.localhost", settings.AuthCookie.Domain);
        Assert.Null(settings.DataProtection.ApplicationName);
        Assert.Null(settings.DataProtection.CertificatePath);
        Assert.Equal(AuditRetentionMode.RetainTenantPurgedSummary, settings.Audit.RetentionMode);
        Assert.Equal(60, settings.Lease.DefaultMinutes);
        Assert.Equal(180, settings.Lease.RecentActivityGraceSeconds);
        Assert.Equal(120, settings.RateLimits.AuthenticatedPerMinute);
    }

    [Fact]
    public void Should_RejectInvalidRuntimeConfiguration_When_AuditRetentionModeIsUnsupported()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.AuditRetentionMode] = "KeepEverything"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.AuditRetentionMode, exception.Message);
    }

    [Fact]
    public void Should_RejectAuditRetentionMode_When_ValueIsNotTheCanonicalExactCaseName()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.AuditRetentionMode] = "retainTenantPurgedSummary"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.AuditRetentionMode, exception.Message);
    }

    [Fact]
    public void Should_FailFast_When_RequiredConfigurationKeyIsMissing()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"));

        configuration.Remove(PaperBinderConfigurationKeys.AuthCookieName);

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.AuthCookieName, exception.Message);
    }

    [Fact]
    public void Should_RejectPublicRootUrl_When_HostDoesNotMatchCookieDomain()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.PublicRootUrl] = "http://localhost:5080"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.PublicRootUrl, exception.Message);
    }

    [Fact]
    public void Should_LoadObservabilityEndpoint_When_Configured()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.ObservabilityOtlpEndpoint] = "http://localhost:4317"
        };

        var settings = PaperBinderRuntimeSettings.Load(
            key => configuration.TryGetValue(key, out var value) ? value : null);

        Assert.Equal("http://localhost:4317/", settings.Observability.OtlpEndpoint?.ToString());
    }

    [Fact]
    public void Should_LoadDataProtectionConfiguration_When_Configured()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.DataProtectionApplicationName] = "PaperBinder-Example",
            [PaperBinderConfigurationKeys.DataProtectionCertificatePath] = "/run/paperbinder-secrets/data-protection.pfx",
            [PaperBinderConfigurationKeys.DataProtectionCertificatePassword] = "test-password"
        };

        var settings = PaperBinderRuntimeSettings.Load(
            key => configuration.TryGetValue(key, out var value) ? value : null);

        Assert.Equal("PaperBinder-Example", settings.DataProtection.ApplicationName);
        Assert.Equal("/run/paperbinder-secrets/data-protection.pfx", settings.DataProtection.CertificatePath);
        Assert.Equal("test-password", settings.DataProtection.CertificatePassword);
    }

    [Fact]
    public void Should_LoadLocalChallengeBypass_When_PublicRootUrlIsLocal()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.ChallengeLocalBypassEnabled] = "true"
        };

        var settings = PaperBinderRuntimeSettings.Load(
            key => configuration.TryGetValue(key, out var value) ? value : null);

        Assert.True(settings.Challenge.LocalBypassEnabled);
    }

    [Fact]
    public void Should_RejectLocalChallengeBypass_When_PublicRootUrlIsNotLocal()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.PublicRootUrl] = "https://lab.danielmaratta.com",
            [PaperBinderConfigurationKeys.AuthCookieDomain] = ".lab.danielmaratta.com",
            [PaperBinderConfigurationKeys.ChallengeLocalBypassEnabled] = "true"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.ChallengeLocalBypassEnabled, exception.Message);
    }

    [Fact]
    public void Should_RejectInvalidObservabilityEndpoint_When_Configured()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.ObservabilityOtlpEndpoint] = "not-a-url"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.ObservabilityOtlpEndpoint, exception.Message);
    }

    [Fact]
    public void Should_RejectDataProtectionCertificatePath_When_PasswordIsMissing()
    {
        var configuration = new Dictionary<string, string?>(TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"))
        {
            [PaperBinderConfigurationKeys.DataProtectionCertificatePath] = "/run/paperbinder-secrets/data-protection.pfx"
        };

        var exception = Assert.Throws<InvalidOperationException>(
            () => PaperBinderRuntimeSettings.Load(
                key => configuration.TryGetValue(key, out var value) ? value : null));

        Assert.Contains(PaperBinderConfigurationKeys.DataProtectionCertificatePath, exception.Message);
        Assert.Contains(PaperBinderConfigurationKeys.DataProtectionCertificatePassword, exception.Message);
    }
}
