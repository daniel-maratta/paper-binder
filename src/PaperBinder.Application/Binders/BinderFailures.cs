namespace PaperBinder.Application.Binders;

public enum BinderFailureKind
{
    NameInvalid,
    NotFound,
    PolicyDenied,
    PolicyInvalid,
    LimitReached
}

public sealed record BinderFailure(
    BinderFailureKind Kind,
    string Detail);
