namespace PaperBinder.Api;

internal enum PaperBinderTenantHostMatchKind
{
    System,
    Tenant,
    Invalid
}

internal readonly record struct PaperBinderTenantHostMatch(
    PaperBinderTenantHostMatchKind Kind,
    string? TenantSlug = null);

internal static class PaperBinderTenantHostResolution
{
    public static PaperBinderTenantHostMatch Resolve(
        string configuredCookieDomain,
        string requestHost,
        bool allowLoopbackHosts)
    {
        var normalizedBaseDomain = NormalizeConfiguredBaseDomain(configuredCookieDomain);
        var normalizedRequestHost = NormalizeRequestHost(requestHost);

        if (normalizedRequestHost is null)
        {
            return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.Invalid);
        }

        if (allowLoopbackHosts && IsLoopbackHost(normalizedRequestHost))
        {
            return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.System);
        }

        if (string.Equals(normalizedRequestHost, normalizedBaseDomain, StringComparison.Ordinal))
        {
            return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.System);
        }

        var suffix = "." + normalizedBaseDomain;
        if (!normalizedRequestHost.EndsWith(suffix, StringComparison.Ordinal))
        {
            return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.Invalid);
        }

        var tenantSlug = normalizedRequestHost[..^suffix.Length];
        if (tenantSlug.Length == 0 ||
            tenantSlug.Contains('.', StringComparison.Ordinal) ||
            !LooksLikeTenantSlug(tenantSlug))
        {
            return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.Invalid);
        }

        return new PaperBinderTenantHostMatch(PaperBinderTenantHostMatchKind.Tenant, tenantSlug);
    }

    private static string NormalizeConfiguredBaseDomain(string configuredCookieDomain)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(configuredCookieDomain);
        return configuredCookieDomain.Trim().Trim('.').ToLowerInvariant();
    }

    private static string? NormalizeRequestHost(string requestHost)
    {
        if (string.IsNullOrWhiteSpace(requestHost))
        {
            return null;
        }

        var normalized = requestHost.Trim().TrimEnd('.').ToLowerInvariant();
        return normalized.Length == 0 ? null : normalized;
    }

    private static bool IsLoopbackHost(string requestHost) =>
        string.Equals(requestHost, "localhost", StringComparison.Ordinal) ||
        string.Equals(requestHost, "127.0.0.1", StringComparison.Ordinal) ||
        string.Equals(requestHost, "[::1]", StringComparison.Ordinal) ||
        string.Equals(requestHost, "::1", StringComparison.Ordinal);

    private static bool LooksLikeTenantSlug(string tenantSlug)
    {
        if (tenantSlug.Length > 63 ||
            !char.IsAsciiLetterOrDigit(tenantSlug[0]) ||
            !char.IsAsciiLetterOrDigit(tenantSlug[^1]))
        {
            return false;
        }

        foreach (var ch in tenantSlug)
        {
            if (!(char.IsAsciiLetterOrDigit(ch) || ch == '-'))
            {
                return false;
            }
        }

        return true;
    }
}
