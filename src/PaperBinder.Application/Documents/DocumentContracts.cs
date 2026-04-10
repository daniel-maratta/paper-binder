using PaperBinder.Application.Tenancy;

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

public sealed record DocumentListQuery(
    TenantContext Tenant,
    TenantRole CallerRole,
    Guid? BinderId,
    bool IncludeArchived);

public sealed record DocumentCreateCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    TenantRole CallerRole,
    Guid? BinderId,
    string? Title,
    string? ContentType,
    string? Content,
    Guid? SupersedesDocumentId);

public sealed record DocumentArchiveCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    TenantRole CallerRole,
    Guid DocumentId);

public enum DocumentFailureKind
{
    NotFound,
    TitleInvalid,
    ContentRequired,
    ContentTooLarge,
    ContentTypeInvalid,
    BinderRequired,
    BinderNotFound,
    BinderPolicyDenied,
    SupersedesInvalid,
    AlreadyArchived,
    NotArchived
}

public sealed record DocumentFailure(
    DocumentFailureKind Kind,
    string Detail);

public sealed record DocumentCreateOutcome(
    bool Succeeded,
    DocumentDetail? Document,
    DocumentFailure? Failure)
{
    public static DocumentCreateOutcome Success(DocumentDetail document) => new(true, document, null);

    public static DocumentCreateOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}

public sealed record DocumentListOutcome(
    bool Succeeded,
    IReadOnlyList<DocumentSummary>? Documents,
    DocumentFailure? Failure)
{
    public static DocumentListOutcome Success(IReadOnlyList<DocumentSummary> documents) => new(true, documents, null);

    public static DocumentListOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}

public sealed record DocumentDetailOutcome(
    bool Succeeded,
    DocumentDetail? Document,
    DocumentFailure? Failure)
{
    public static DocumentDetailOutcome Success(DocumentDetail document) => new(true, document, null);

    public static DocumentDetailOutcome Failed(DocumentFailure failure) => new(false, null, failure);
}
