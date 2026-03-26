using Microsoft.Extensions.Hosting;

namespace PaperBinder.Api;

public static class FrontendHostingPolicy
{
    public static bool ShouldServeCompiledFrontend(string environmentName, bool hasFrontendEntryPoint)
    {
        return hasFrontendEntryPoint
            && !string.Equals(environmentName, Environments.Development, StringComparison.OrdinalIgnoreCase);
    }
}
