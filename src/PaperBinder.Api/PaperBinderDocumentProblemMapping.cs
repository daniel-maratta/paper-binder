using PaperBinder.Application.Documents;

namespace PaperBinder.Api;

internal sealed record DocumentProblemContract(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);

internal static class PaperBinderDocumentProblemMapping
{
    public static DocumentProblemContract Map(DocumentFailure failure) =>
        failure.Kind switch
        {
            DocumentFailureKind.NotFound => new(
                StatusCodes.Status404NotFound,
                "Document not found.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentNotFound),

            DocumentFailureKind.TitleInvalid => new(
                StatusCodes.Status400BadRequest,
                "Document title invalid.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentTitleInvalid),

            DocumentFailureKind.ContentRequired => new(
                StatusCodes.Status400BadRequest,
                "Document content required.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentContentRequired),

            DocumentFailureKind.ContentTooLarge => new(
                StatusCodes.Status400BadRequest,
                "Document content too large.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentContentTooLarge),

            DocumentFailureKind.ContentTypeInvalid => new(
                StatusCodes.Status422UnprocessableEntity,
                "Document content type invalid.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentContentTypeInvalid),

            DocumentFailureKind.BinderRequired => new(
                StatusCodes.Status400BadRequest,
                "Document binder required.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentBinderRequired),

            DocumentFailureKind.BinderNotFound => new(
                StatusCodes.Status404NotFound,
                "Binder not found.",
                failure.Detail,
                PaperBinderErrorCodes.BinderNotFound),

            DocumentFailureKind.BinderPolicyDenied => new(
                StatusCodes.Status403Forbidden,
                "Binder access denied.",
                failure.Detail,
                PaperBinderErrorCodes.BinderPolicyDenied),

            DocumentFailureKind.SupersedesInvalid => new(
                StatusCodes.Status422UnprocessableEntity,
                "Document supersedes reference invalid.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentSupersedesInvalid),

            DocumentFailureKind.AlreadyArchived => new(
                StatusCodes.Status409Conflict,
                "Document already archived.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentAlreadyArchived),

            DocumentFailureKind.NotArchived => new(
                StatusCodes.Status409Conflict,
                "Document not archived.",
                failure.Detail,
                PaperBinderErrorCodes.DocumentNotArchived),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown document failure.")
        };
}
