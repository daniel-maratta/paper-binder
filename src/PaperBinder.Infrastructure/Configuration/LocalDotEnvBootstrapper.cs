namespace PaperBinder.Infrastructure.Configuration;

public static class LocalDotEnvBootstrapper
{
    public static void LoadMissingEnvironmentVariables(string startDirectory)
    {
        if (string.IsNullOrWhiteSpace(startDirectory))
        {
            return;
        }

        var envFilePath = FindNearestDotEnvFile(startDirectory);
        if (envFilePath is null)
        {
            return;
        }

        foreach (var (key, value) in Parse(envFilePath))
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }

    private static string? FindNearestDotEnvFile(string startDirectory)
    {
        for (var directory = new DirectoryInfo(Path.GetFullPath(startDirectory));
             directory is not null;
             directory = directory.Parent)
        {
            var dotEnvPath = Path.Combine(directory.FullName, ".env");
            if (File.Exists(dotEnvPath))
            {
                return dotEnvPath;
            }

            var dotEnvExamplePath = Path.Combine(directory.FullName, ".env.example");
            if (File.Exists(dotEnvExamplePath))
            {
                return dotEnvExamplePath;
            }
        }

        return null;
    }

    private static IEnumerable<KeyValuePair<string, string>> Parse(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            var value = line[(separatorIndex + 1)..].Trim();
            if (value.Length >= 2 &&
                ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            yield return new KeyValuePair<string, string>(key, value);
        }
    }
}
