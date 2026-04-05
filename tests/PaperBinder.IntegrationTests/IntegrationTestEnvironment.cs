using System.Runtime.CompilerServices;
using PaperBinder.Api;

namespace PaperBinder.IntegrationTests;

internal static class IntegrationTestEnvironment
{
    [ModuleInitializer]
    public static void Initialize()
    {
        Environment.SetEnvironmentVariable(
            PaperBinderChallengeVerification.TestEnvironmentVariableName,
            PaperBinderChallengeVerification.TestEnvironmentValue);
    }
}
