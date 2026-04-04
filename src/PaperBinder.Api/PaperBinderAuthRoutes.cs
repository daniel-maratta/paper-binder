namespace PaperBinder.Api;

internal static class PaperBinderAuthRoutes
{
    public static readonly PathString LoginPath = new("/api/auth/login");
    public static readonly PathString LogoutPath = new("/api/auth/logout");
    public static readonly PathString ProvisionPath = new("/api/provision");

    public static bool IsRootHostPreAuthRoute(PathString path) =>
        path.Equals(LoginPath, StringComparison.Ordinal) ||
        path.Equals(ProvisionPath, StringComparison.Ordinal);

    public static bool IsLogoutRoute(PathString path) =>
        path.Equals(LogoutPath, StringComparison.Ordinal);
}
