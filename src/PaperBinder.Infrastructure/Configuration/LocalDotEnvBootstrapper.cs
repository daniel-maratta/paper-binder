namespace PaperBinder.Infrastructure.Configuration;

public static class LocalDotEnvBootstrapper
{
    public static void LoadMissingEnvironmentVariables(string startDirectory)
    {
        if (string.IsNullOrWhiteSpace(startDirectory))
        {
            return;
        }

        var configurationDirectory = FindNearestConfigurationDirectory(startDirectory);
        if (configurationDirectory is null)
        {
            return;
        }

        LoadMissingEnvironmentVariablesFromFile(Path.Combine(configurationDirectory.FullName, ".env"));
        LoadMissingEnvironmentVariablesFromFile(Path.Combine(configurationDirectory.FullName, ".env.example"));
    }

    private static void LoadMissingEnvironmentVariablesFromFile(string path)
    {
        if (!File.Exists(path))
        {
            return;
        }

        foreach (var (key, value) in Parse(path))
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }

    private static DirectoryInfo? FindNearestConfigurationDirectory(string startDirectory)
    {
        for (var directory = new DirectoryInfo(Path.GetFullPath(startDirectory));
             directory is not null;
             directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, ".env")) ||
                File.Exists(Path.Combine(directory.FullName, ".env.example")))
            {
                return directory;
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
