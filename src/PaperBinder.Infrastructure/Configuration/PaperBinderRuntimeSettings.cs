using System.Data.Common;

namespace PaperBinder.Infrastructure.Configuration;

public sealed record PaperBinderRuntimeSettings(
    DatabaseSettings Database,
    AuthCookieSettings AuthCookie,
    ChallengeSettings Challenge,
    LeaseSettings Lease,
    RateLimitSettings RateLimits,
    AuditSettings Audit)
{
    public static PaperBinderRuntimeSettings Load(Func<string, string?> getValue)
    {
        ArgumentNullException.ThrowIfNull(getValue);

        var errors = new List<string>();

        var connectionString = GetRequiredValue(getValue, PaperBinderConfigurationKeys.DbConnection, errors);
        var cookieDomain = GetRequiredValue(getValue, PaperBinderConfigurationKeys.AuthCookieDomain, errors);
        var cookieName = GetRequiredValue(getValue, PaperBinderConfigurationKeys.AuthCookieName, errors);
        var keyRingPath = GetRequiredValue(getValue, PaperBinderConfigurationKeys.AuthKeyRingPath, errors);
        var challengeSiteKey = GetRequiredValue(getValue, PaperBinderConfigurationKeys.ChallengeSiteKey, errors);
        var challengeSecretKey = GetRequiredValue(getValue, PaperBinderConfigurationKeys.ChallengeSecretKey, errors);
        var auditRetentionModeValue = GetRequiredValue(getValue, PaperBinderConfigurationKeys.AuditRetentionMode, errors);

        var defaultMinutes = GetPositiveInt(getValue, PaperBinderConfigurationKeys.LeaseDefaultMinutes, errors);
        var extensionMinutes = GetPositiveInt(getValue, PaperBinderConfigurationKeys.LeaseExtensionMinutes, errors);
        var maxExtensions = GetPositiveInt(getValue, PaperBinderConfigurationKeys.LeaseMaxExtensions, errors);
        var cleanupIntervalSeconds = GetPositiveInt(getValue, PaperBinderConfigurationKeys.LeaseCleanupIntervalSeconds, errors);
        var preAuthPerMinute = GetPositiveInt(getValue, PaperBinderConfigurationKeys.RateLimitPreAuthPerMinute, errors);
        var authenticatedPerMinute = GetPositiveInt(getValue, PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute, errors);
        var leaseExtendPerMinute = GetPositiveInt(getValue, PaperBinderConfigurationKeys.RateLimitLeaseExtendPerMinute, errors);

        DatabaseSettings? database = null;
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            database = TryParseDatabaseSettings(connectionString!, errors);
        }

        AuditRetentionMode? auditRetentionMode = null;
        if (!string.IsNullOrWhiteSpace(auditRetentionModeValue))
        {
            auditRetentionMode = auditRetentionModeValue switch
            {
                nameof(AuditRetentionMode.PurgeTenantAudit) => AuditRetentionMode.PurgeTenantAudit,
                nameof(AuditRetentionMode.RetainTenantPurgedSummary) => AuditRetentionMode.RetainTenantPurgedSummary,
                _ => AddAuditModeError(auditRetentionModeValue!, errors)
            };
        }

        if (errors.Count > 0)
        {
            throw new InvalidOperationException(
                "PaperBinder runtime configuration is invalid. " + string.Join(" ", errors));
        }

        return new PaperBinderRuntimeSettings(
            database!,
            new AuthCookieSettings(cookieDomain!, cookieName!, keyRingPath!),
            new ChallengeSettings(challengeSiteKey!, challengeSecretKey!),
            new LeaseSettings(defaultMinutes, extensionMinutes, maxExtensions, cleanupIntervalSeconds),
            new RateLimitSettings(preAuthPerMinute, authenticatedPerMinute, leaseExtendPerMinute),
            new AuditSettings(auditRetentionMode!.Value));
    }

    private static string? GetRequiredValue(
        Func<string, string?> getValue,
        string key,
        ICollection<string> errors)
    {
        var value = getValue(key);
        if (!string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        errors.Add($"Missing required configuration key `{key}`.");
        return null;
    }

    private static int GetPositiveInt(
        Func<string, string?> getValue,
        string key,
        ICollection<string> errors)
    {
        var rawValue = getValue(key);
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            errors.Add($"Missing required configuration key `{key}`.");
            return 0;
        }

        if (!int.TryParse(rawValue, out var parsedValue) || parsedValue <= 0)
        {
            errors.Add($"Configuration key `{key}` must be a positive integer.");
            return 0;
        }

        return parsedValue;
    }

    private static DatabaseSettings? TryParseDatabaseSettings(
        string connectionString,
        ICollection<string> errors)
    {
        try
        {
            var builder = new DbConnectionStringBuilder
            {
                ConnectionString = connectionString
            };

            if (!builder.TryGetValue("Host", out var hostValue) || string.IsNullOrWhiteSpace(hostValue?.ToString()))
            {
                errors.Add($"Configuration key `{PaperBinderConfigurationKeys.DbConnection}` must include `Host`.");
                return null;
            }

            var port = 5432;
            if (builder.TryGetValue("Port", out var portValue))
            {
                if (!int.TryParse(portValue?.ToString(), out port) || port <= 0)
                {
                    errors.Add($"Configuration key `{PaperBinderConfigurationKeys.DbConnection}` must include a valid `Port`.");
                    return null;
                }
            }

            return new DatabaseSettings(connectionString, hostValue.ToString()!, port);
        }
        catch (ArgumentException)
        {
            errors.Add($"Configuration key `{PaperBinderConfigurationKeys.DbConnection}` must be a valid connection string.");
            return null;
        }
    }

    private static AuditRetentionMode AddAuditModeError(
        string invalidValue,
        ICollection<string> errors)
    {
        errors.Add(
            $"Configuration key `{PaperBinderConfigurationKeys.AuditRetentionMode}` must be `PurgeTenantAudit` or `RetainTenantPurgedSummary`, but was `{invalidValue}`.");
        return default;
    }
}

public sealed record DatabaseSettings(
    string ConnectionString,
    string Host,
    int Port);

public sealed record AuthCookieSettings(
    string Domain,
    string Name,
    string KeyRingPath);

public sealed record ChallengeSettings(
    string SiteKey,
    string SecretKey);

public sealed record LeaseSettings(
    int DefaultMinutes,
    int ExtensionMinutes,
    int MaxExtensions,
    int CleanupIntervalSeconds);

public sealed record RateLimitSettings(
    int PreAuthPerMinute,
    int AuthenticatedPerMinute,
    int LeaseExtendPerMinute);

public sealed record AuditSettings(
    AuditRetentionMode RetentionMode);

public enum AuditRetentionMode
{
    PurgeTenantAudit,
    RetainTenantPurgedSummary
}

public static class PaperBinderConfigurationKeys
{
    public const string DbConnection = "PAPERBINDER_DB_CONNECTION";
    public const string AuthCookieDomain = "PAPERBINDER_AUTH_COOKIE_DOMAIN";
    public const string AuthCookieName = "PAPERBINDER_AUTH_COOKIE_NAME";
    public const string AuthKeyRingPath = "PAPERBINDER_AUTH_KEY_RING_PATH";
    public const string ChallengeSiteKey = "PAPERBINDER_CHALLENGE_SITE_KEY";
    public const string ChallengeSecretKey = "PAPERBINDER_CHALLENGE_SECRET_KEY";
    public const string LeaseDefaultMinutes = "PAPERBINDER_LEASE_DEFAULT_MINUTES";
    public const string LeaseExtensionMinutes = "PAPERBINDER_LEASE_EXTENSION_MINUTES";
    public const string LeaseMaxExtensions = "PAPERBINDER_LEASE_MAX_EXTENSIONS";
    public const string LeaseCleanupIntervalSeconds = "PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS";
    public const string RateLimitPreAuthPerMinute = "PAPERBINDER_RATE_LIMIT_PREAUTH_PER_MINUTE";
    public const string RateLimitAuthenticatedPerMinute = "PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE";
    public const string RateLimitLeaseExtendPerMinute = "PAPERBINDER_RATE_LIMIT_LEASE_EXTEND_PER_MINUTE";
    public const string AuditRetentionMode = "PAPERBINDER_AUDIT_RETENTION_MODE";
}
