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
    public void Should_FillMissingKeysFromDotEnvExample_WhenDotEnvIsPartial()
    {
        var dotEnvKey = $"PB_TEST_{Guid.NewGuid():N}";
        var exampleOnlyKey = $"PB_TEST_{Guid.NewGuid():N}";
        var root = CreateTempDirectory();
        var startDirectory = Directory.CreateDirectory(Path.Combine(root, "src", "PaperBinder.Api")).FullName;

        File.WriteAllText(
            Path.Combine(root, ".env"),
            $"{dotEnvKey}=from-dotenv{Environment.NewLine}");
        File.WriteAllText(
            Path.Combine(root, ".env.example"),
            $"{dotEnvKey}=from-example{Environment.NewLine}{exampleOnlyKey}=from-example-only{Environment.NewLine}");

        var originalDotEnvValue = Environment.GetEnvironmentVariable(dotEnvKey);
        var originalExampleOnlyValue = Environment.GetEnvironmentVariable(exampleOnlyKey);

        try
        {
            Environment.SetEnvironmentVariable(dotEnvKey, null);
            Environment.SetEnvironmentVariable(exampleOnlyKey, null);

            LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(startDirectory);

            Assert.Equal("from-dotenv", Environment.GetEnvironmentVariable(dotEnvKey));
            Assert.Equal("from-example-only", Environment.GetEnvironmentVariable(exampleOnlyKey));
        }
        finally
        {
            Environment.SetEnvironmentVariable(dotEnvKey, originalDotEnvValue);
            Environment.SetEnvironmentVariable(exampleOnlyKey, originalExampleOnlyValue);
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
