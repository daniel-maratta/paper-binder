namespace PaperBinder.Application.Tenancy;

public static class TenantLeaseCleanupRules
{
    public static bool CanPurgeExpiredTenant(
        DateTimeOffset expiresAtUtc,
        DateTimeOffset? lastAuthenticatedActivityAtUtc,
        TimeSpan recentActivityGrace,
        DateTimeOffset now)
    {
        if (expiresAtUtc > now)
        {
            return false;
        }

        if (lastAuthenticatedActivityAtUtc is null)
        {
            return true;
        }

        return lastAuthenticatedActivityAtUtc.Value <= now - recentActivityGrace;
    }
}
