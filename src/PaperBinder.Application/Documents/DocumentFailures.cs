namespace PaperBinder.Application.Documents;

public enum DocumentFailureKind
{
    NotFound,
    TitleInvalid,
    TitleConflict,
    ContentRequired,
    ContentTooLarge,
    ContentTypeInvalid,
    BinderRequired,
    BinderNotFound,
    BinderPolicyDenied,
    SupersedesInvalid,
    AlreadyArchived,
    NotArchived,
    LimitReached
}

public sealed record DocumentFailure(
    DocumentFailureKind Kind,
    string Detail);
