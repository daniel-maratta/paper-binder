namespace PaperBinder.Api;

internal static class PaperBinderAuthEndpointHostPolicy
{
    public static bool AllowsLogin(IRequestResolvedTenantHostContext requestHostContext)
    {
        ArgumentNullException.ThrowIfNull(requestHostContext);
        return requestHostContext.IsSystemHost;
    }

    public static bool AllowsProvision(IRequestResolvedTenantHostContext requestHostContext)
    {
        ArgumentNullException.ThrowIfNull(requestHostContext);
        return requestHostContext.IsSystemHost;
    }

    public static bool AllowsLogout(IRequestResolvedTenantHostContext requestHostContext)
    {
        ArgumentNullException.ThrowIfNull(requestHostContext);
        return requestHostContext.IsTenantHost;
    }
}
