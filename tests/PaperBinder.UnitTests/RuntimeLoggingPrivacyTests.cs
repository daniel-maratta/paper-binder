using System.Text.RegularExpressions;

namespace PaperBinder.UnitTests;

public sealed partial class RuntimeLoggingPrivacyTests
{
    private static readonly string[] RuntimeSourceRoots =
    [
        "src/PaperBinder.Api",
        "src/PaperBinder.Infrastructure",
        "src/PaperBinder.Worker"
    ];

    private static readonly string[] DisallowedLogFields =
    [
        "TenantSlug",
        "tenant_slug",
        "TenantName",
        "tenant_name",
        "Email",
        "email",
        "Password",
        "password",
        "Credential",
        "credential",
        "BinderName",
        "binder_name",
        "DocumentTitle",
        "document_title",
        "DocumentContent",
        "document_content",
        "Content",
        "content"
    ];

    [Fact]
    public void RuntimeLoggerCalls_Should_NotIncludeUserSubmittedNamesContentEmailsOrCredentials()
    {
        var repoRoot = FindRepoRoot();
        var violations = new List<string>();

        foreach (var sourceRoot in RuntimeSourceRoots)
        {
            var absoluteSourceRoot = Path.Combine(repoRoot.FullName, sourceRoot);
            foreach (var filePath in Directory.EnumerateFiles(absoluteSourceRoot, "*.cs", SearchOption.AllDirectories))
            {
                var relativePath = Path.GetRelativePath(repoRoot.FullName, filePath).Replace('\\', '/');
                var source = File.ReadAllText(filePath);
                foreach (Match match in LoggerCallRegex().Matches(source))
                {
                    var loggerCall = match.Value;
                    foreach (var field in DisallowedLogFields)
                    {
                        if (ContainsStructuredLogField(loggerCall, field))
                        {
                            violations.Add($"{relativePath}: disallowed logging field `{field}`");
                        }
                    }
                }
            }
        }

        Assert.True(
            violations.Count == 0,
            "Runtime logs must not include user-submitted names, content, emails, passwords, or credentials." +
            Environment.NewLine +
            string.Join(Environment.NewLine, violations));
    }

    private static bool ContainsStructuredLogField(string loggerCall, string field) =>
        loggerCall.Contains($"{field}=", StringComparison.Ordinal) ||
        loggerCall.Contains($"{{{field}}}", StringComparison.Ordinal);

    private static DirectoryInfo FindRepoRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "PaperBinder.sln")))
            {
                return directory;
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException("Could not locate the PaperBinder repository root.");
    }

    [GeneratedRegex(@"logger\.Log(?:Trace|Debug|Information|Warning|Error|Critical)\([\s\S]*?\);", RegexOptions.CultureInvariant)]
    private static partial Regex LoggerCallRegex();
}
