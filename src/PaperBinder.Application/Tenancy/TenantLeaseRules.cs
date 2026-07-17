namespace PaperBinder.Application.Tenancy;

public static class TenantLeaseRules
{
    public static TenantLeaseState ProjectState(
        TenantLeaseSnapshot snapshot,
        TenantLeasePolicy policy,
        DateTimeOffset now) =>
        new(
            snapshot.ExpiresAtUtc,
            GetSecondsRemaining(snapshot.ExpiresAtUtc, now),
            snapshot.ExtensionCount,
            policy.MaxExtensions,
            CanExtend(snapshot.ExpiresAtUtc, snapshot.ExtensionCount, policy, now));

    public static bool CanExtend(
        DateTimeOffset expiresAtUtc,
        int extensionCount,
        TenantLeasePolicy policy,
        DateTimeOffset now)
    {
        if (extensionCount >= policy.MaxExtensions)
        {
            return false;
        }

        var remaining = expiresAtUtc - now;
        if (remaining <= TimeSpan.Zero)
        {
            return false;
        }

        return remaining <= TimeSpan.FromMinutes(policy.ExtensionMinutes);
    }

    public static int GetSecondsRemaining(DateTimeOffset expiresAtUtc, DateTimeOffset now)
    {
        var remaining = expiresAtUtc - now;
        if (remaining <= TimeSpan.Zero)
        {
            return 0;
        }

        return (int)remaining.TotalSeconds;
    }
}
