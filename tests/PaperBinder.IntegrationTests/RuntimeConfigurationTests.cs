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

        var settings = PaperBinderRuntimeSettings.Load(key => configuration[key]);

        Assert.Equal("localhost", settings.Database.Host);
        Assert.Equal(5432, settings.Database.Port);
        Assert.Equal("http://paperbinder.localhost:8080/", settings.PublicUrl.RootUrl.ToString());
        Assert.Equal(".paperbinder.localhost", settings.AuthCookie.Domain);
        Assert.Equal(AuditRetentionMode.RetainTenantPurgedSummary, settings.Audit.RetentionMode);
        Assert.Equal(60, settings.Lease.DefaultMinutes);
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
            () => PaperBinderRuntimeSettings.Load(key => configuration[key]));

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
            () => PaperBinderRuntimeSettings.Load(key => configuration[key]));

        Assert.Contains(PaperBinderConfigurationKeys.PublicRootUrl, exception.Message);
    }
}
