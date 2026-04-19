namespace PaperBinder.Api;

internal static class PaperBinderTenantRedirectUrlBuilder
{
    public static Uri Build(Uri publicRootUrl, string tenantSlug)
    {
        ArgumentNullException.ThrowIfNull(publicRootUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantSlug);

        var builder = new UriBuilder(publicRootUrl)
        {
            Host = $"{tenantSlug}.{publicRootUrl.Host}",
            Path = "/app",
            Query = string.Empty,
            Fragment = string.Empty
        };

        return builder.Uri;
    }

    public static Uri BuildRootLogin(Uri publicRootUrl)
    {
        ArgumentNullException.ThrowIfNull(publicRootUrl);
        return new Uri(publicRootUrl, "/login");
    }
}
