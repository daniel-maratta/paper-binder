namespace PaperBinder.Application.Documents;

public static class DocumentRules
{
    public const int MaxTitleLength = 200;
    public const int MaxContentLength = 50_000;
    public const string MarkdownContentType = "markdown";

    public static bool TryNormalizeTitle(string? value, out string normalizedTitle)
    {
        normalizedTitle = value?.Trim() ?? string.Empty;
        return normalizedTitle.Length is > 0 and <= MaxTitleLength;
    }

    public static bool HasRequiredContent(string? value) =>
        !string.IsNullOrWhiteSpace(value);

    public static bool IsContentLengthValid(string? value) =>
        value is not null && value.Length <= MaxContentLength;

    public static bool IsSupportedContentType(string? value) =>
        string.Equals(value, MarkdownContentType, StringComparison.Ordinal);

    public static DocumentFailureKind? ValidateArchiveTransition(DateTimeOffset? archivedAtUtc, bool archiveRequested) =>
        archiveRequested
            ? archivedAtUtc is null ? null : DocumentFailureKind.AlreadyArchived
            : archivedAtUtc is null ? DocumentFailureKind.NotArchived : null;
}
