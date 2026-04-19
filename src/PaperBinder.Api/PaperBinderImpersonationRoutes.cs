namespace PaperBinder.Api;

internal static class PaperBinderImpersonationRoutes
{
    public static readonly PathString Route = new("/api/tenant/impersonation");

    public static bool IsStopRoute(PathString path) =>
        path.Equals(Route, StringComparison.Ordinal);
}
