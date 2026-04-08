using PaperBinder.Application.Binders;

namespace PaperBinder.Api;

internal sealed record BinderProblemContract(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);

internal static class PaperBinderBinderProblemMapping
{
    public static BinderProblemContract Map(BinderFailure failure) =>
        failure.Kind switch
        {
            BinderFailureKind.NameInvalid => new(
                StatusCodes.Status400BadRequest,
                "Binder name invalid.",
                failure.Detail,
                PaperBinderErrorCodes.BinderNameInvalid),

            BinderFailureKind.NotFound => new(
                StatusCodes.Status404NotFound,
                "Binder not found.",
                failure.Detail,
                PaperBinderErrorCodes.BinderNotFound),

            BinderFailureKind.PolicyDenied => new(
                StatusCodes.Status403Forbidden,
                "Binder access denied.",
                failure.Detail,
                PaperBinderErrorCodes.BinderPolicyDenied),

            BinderFailureKind.PolicyInvalid => new(
                StatusCodes.Status422UnprocessableEntity,
                "Binder policy invalid.",
                failure.Detail,
                PaperBinderErrorCodes.BinderPolicyInvalid),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown binder failure.")
        };
}
