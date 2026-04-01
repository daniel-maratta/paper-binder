using Microsoft.Extensions.Hosting;

namespace PaperBinder.Api;

public static class FrontendHostingPolicy
{
    public const string HostingModeConfigurationKey = "PAPERBINDER_FRONTEND_HOSTING_MODE";
    public const string CompiledHostingMode = "compiled";

    public static bool RequiresCompiledFrontend(string? requestedMode)
    {
        return string.Equals(requestedMode, CompiledHostingMode, StringComparison.OrdinalIgnoreCase);
    }

    public static bool ShouldServeCompiledFrontend(
        string environmentName,
        bool hasFrontendEntryPoint,
        string? requestedMode = null)
    {
        if (!hasFrontendEntryPoint)
        {
            return false;
        }

        if (RequiresCompiledFrontend(requestedMode))
        {
            return true;
        }

        return !string.Equals(environmentName, Environments.Development, StringComparison.OrdinalIgnoreCase);
    }
}
