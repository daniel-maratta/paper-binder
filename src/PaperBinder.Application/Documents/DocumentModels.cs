namespace PaperBinder.Application.Documents;

public sealed record DocumentSummary(
    Guid DocumentId,
    Guid BinderId,
    string Title,
    string ContentType,
    Guid? SupersedesDocumentId,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ArchivedAtUtc);

public sealed record DocumentDetail(
    Guid DocumentId,
    Guid BinderId,
    string Title,
    string ContentType,
    string Content,
    Guid? SupersedesDocumentId,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? ArchivedAtUtc);
