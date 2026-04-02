namespace PaperBinder.Api;

internal static class PaperBinderRequestCorrelation
{
    private const string CorrelationIdItemKey = "PaperBinder.Http.CorrelationId";
    private const int MaxCorrelationIdLength = 64;

    public static string Resolve(HttpContext context)
    {
        if (TryGetValidClientValue(context.Request.Headers[PaperBinderHttpHeaders.CorrelationId], out var correlationId))
        {
            context.Items[CorrelationIdItemKey] = correlationId;
            return correlationId;
        }

        correlationId = Guid.NewGuid().ToString("N");
        context.Items[CorrelationIdItemKey] = correlationId;
        return correlationId;
    }

    public static string? Get(HttpContext context) =>
        context.Items.TryGetValue(CorrelationIdItemKey, out var value) ? value as string : null;

    internal static bool TryGetValidClientValue(Microsoft.Extensions.Primitives.StringValues values, out string correlationId)
    {
        correlationId = string.Empty;

        if (values.Count != 1)
        {
            return false;
        }

        var candidate = values[0];
        if (string.IsNullOrEmpty(candidate) || candidate.Length > MaxCorrelationIdLength)
        {
            return false;
        }

        foreach (var character in candidate)
        {
            if (character is < '!' or > '~' or ',')
            {
                return false;
            }
        }

        correlationId = candidate;
        return true;
    }
}
