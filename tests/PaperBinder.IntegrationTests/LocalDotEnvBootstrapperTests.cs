using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class LocalDotEnvBootstrapperTests
{
    [Fact]
    public void Should_LoadMissingEnvironmentVariables_FromNearestDotEnvFile()
    {
        var key = $"PB_TEST_{Guid.NewGuid():N}";
        var root = CreateTempDirectory();
        var startDirectory = Directory.CreateDirectory(Path.Combine(root, "src", "PaperBinder.Api")).FullName;

        File.WriteAllText(Path.Combine(root, ".env"), $"{key}=from-dotenv{Environment.NewLine}");

        var originalValue = Environment.GetEnvironmentVariable(key);

        try
        {
            Environment.SetEnvironmentVariable(key, null);

            LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(startDirectory);

            Assert.Equal("from-dotenv", Environment.GetEnvironmentVariable(key));
        }
        finally
        {
            Environment.SetEnvironmentVariable(key, originalValue);
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void Should_FallBackToDotEnvExample_WhenDotEnvIsMissing()
    {
        var key = $"PB_TEST_{Guid.NewGuid():N}";
        var root = CreateTempDirectory();
        var startDirectory = Directory.CreateDirectory(Path.Combine(root, "src", "PaperBinder.Api")).FullName;

        File.WriteAllText(Path.Combine(root, ".env.example"), $"{key}=from-example{Environment.NewLine}");

        var originalValue = Environment.GetEnvironmentVariable(key);

        try
        {
            Environment.SetEnvironmentVariable(key, null);

            LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(startDirectory);

            Assert.Equal("from-example", Environment.GetEnvironmentVariable(key));
        }
        finally
        {
            Environment.SetEnvironmentVariable(key, originalValue);
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void Should_NotOverrideExistingEnvironmentVariables()
    {
        var key = $"PB_TEST_{Guid.NewGuid():N}";
        var root = CreateTempDirectory();
        var startDirectory = Directory.CreateDirectory(Path.Combine(root, "src", "PaperBinder.Api")).FullName;

        File.WriteAllText(Path.Combine(root, ".env"), $"{key}=from-dotenv{Environment.NewLine}");

        var originalValue = Environment.GetEnvironmentVariable(key);

        try
        {
            Environment.SetEnvironmentVariable(key, "already-set");

            LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(startDirectory);

            Assert.Equal("already-set", Environment.GetEnvironmentVariable(key));
        }
        finally
        {
            Environment.SetEnvironmentVariable(key, originalValue);
            Directory.Delete(root, recursive: true);
        }
    }

    private static string CreateTempDirectory()
    {
        var path = Path.Combine(Path.GetTempPath(), "paperbinder-tests", Guid.NewGuid().ToString("N"));
        return Directory.CreateDirectory(path).FullName;
    }
}
