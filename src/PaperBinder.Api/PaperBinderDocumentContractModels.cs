using PaperBinder.Application.Documents;

namespace PaperBinder.Api;

internal sealed record DocumentSummaryResponse(
    Guid DocumentId,
    Guid BinderId,
    string Title,
    string ContentType,
    Guid? SupersedesDocumentId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ArchivedAt);

internal sealed record DocumentDetailResponse(
    Guid DocumentId,
    Guid BinderId,
    string Title,
    string ContentType,
    string Content,
    Guid? SupersedesDocumentId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ArchivedAt);

internal static class PaperBinderDocumentResponseMapping
{
    public static DocumentSummaryResponse MapSummary(DocumentSummary document) =>
        new(
            document.DocumentId,
            document.BinderId,
            document.Title,
            document.ContentType,
            document.SupersedesDocumentId,
            document.CreatedAtUtc,
            document.ArchivedAtUtc);

    public static DocumentDetailResponse MapDetail(DocumentDetail document) =>
        new(
            document.DocumentId,
            document.BinderId,
            document.Title,
            document.ContentType,
            document.Content,
            document.SupersedesDocumentId,
            document.CreatedAtUtc,
            document.ArchivedAtUtc);
}
