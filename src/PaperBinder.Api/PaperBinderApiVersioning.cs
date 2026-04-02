using Microsoft.Extensions.Primitives;

namespace PaperBinder.Api;

internal static class PaperBinderApiVersioning
{
    private const string NegotiatedVersionItemKey = "PaperBinder.Http.ApiVersion";

    public const string CurrentVersion = "1";
    public const string UnsupportedVersionErrorCode = "API_VERSION_UNSUPPORTED";

    public static string? GetNegotiatedVersion(HttpContext context) =>
        context.Items.TryGetValue(NegotiatedVersionItemKey, out var value) ? value as string : null;

    public static bool TryResolveRequestedVersion(StringValues values, out string version)
    {
        version = CurrentVersion;

        if (values.Count == 0)
        {
            return true;
        }

        if (values.Count != 1)
        {
            return false;
        }

        var candidate = values[0]?.Trim();
        if (string.Equals(candidate, CurrentVersion, StringComparison.Ordinal))
        {
            version = CurrentVersion;
            return true;
        }

        return false;
    }

    public static void SetNegotiatedVersion(HttpContext context, string version)
    {
        context.Items[NegotiatedVersionItemKey] = version;
    }
}
