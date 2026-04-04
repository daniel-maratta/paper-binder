using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

internal static class TestRuntimeConfiguration
{
    public static IReadOnlyDictionary<string, string?> Create(
        string databaseConnection) =>
        new Dictionary<string, string?>
        {
            [PaperBinderConfigurationKeys.DbConnection] = databaseConnection,
            [PaperBinderConfigurationKeys.PublicRootUrl] = "http://paperbinder.localhost:8080",
            [PaperBinderConfigurationKeys.AuthCookieDomain] = ".paperbinder.localhost",
            [PaperBinderConfigurationKeys.AuthCookieName] = "paperbinder.auth",
            [PaperBinderConfigurationKeys.AuthKeyRingPath] = "paperbinder-local-keys",
            [PaperBinderConfigurationKeys.ChallengeSiteKey] = "local-demo-site-key",
            [PaperBinderConfigurationKeys.ChallengeSecretKey] = "local-demo-secret-key",
            [PaperBinderConfigurationKeys.LeaseDefaultMinutes] = "60",
            [PaperBinderConfigurationKeys.LeaseExtensionMinutes] = "10",
            [PaperBinderConfigurationKeys.LeaseMaxExtensions] = "3",
            [PaperBinderConfigurationKeys.LeaseCleanupIntervalSeconds] = "60",
            [PaperBinderConfigurationKeys.RateLimitPreAuthPerMinute] = "30",
            [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "120",
            [PaperBinderConfigurationKeys.RateLimitLeaseExtendPerMinute] = "10",
            [PaperBinderConfigurationKeys.AuditRetentionMode] = nameof(AuditRetentionMode.RetainTenantPurgedSummary)
        };
}
