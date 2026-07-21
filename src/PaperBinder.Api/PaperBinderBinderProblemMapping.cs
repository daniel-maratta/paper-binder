using PaperBinder.Application.Binders;

namespace PaperBinder.Api;

internal static class PaperBinderBinderProblemMapping
{
    public static PaperBinderApiProblem Map(BinderFailure failure) =>
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

            BinderFailureKind.LimitReached => new(
                StatusCodes.Status409Conflict,
                "Binder limit reached.",
                failure.Detail,
                PaperBinderErrorCodes.BinderLimitReached),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown binder failure.")
        };
}
