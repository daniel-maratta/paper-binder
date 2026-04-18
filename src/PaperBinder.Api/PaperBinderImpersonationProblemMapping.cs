namespace PaperBinder.Api;

internal enum TenantImpersonationFailureKind
{
    AccessDenied,
    TargetUserIdInvalid,
    TargetUserNotFound,
    SelfTargetRejected,
    AlreadyActive,
    NotActive,
    SessionConflict
}

internal sealed record TenantImpersonationFailure(
    TenantImpersonationFailureKind Kind,
    string Detail);

internal sealed record TenantImpersonationProblemContract(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);

internal static class PaperBinderImpersonationProblemMapping
{
    public static TenantImpersonationProblemContract Map(TenantImpersonationFailure failure) =>
        failure.Kind switch
        {
            TenantImpersonationFailureKind.AccessDenied => new(
                StatusCodes.Status403Forbidden,
                "Tenant impersonation not allowed.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationNotAllowed),

            TenantImpersonationFailureKind.TargetUserIdInvalid => new(
                StatusCodes.Status400BadRequest,
                "Tenant impersonation target invalid.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationTargetInvalid),

            TenantImpersonationFailureKind.TargetUserNotFound => new(
                StatusCodes.Status404NotFound,
                "Tenant impersonation target not found.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationTargetNotFound),

            TenantImpersonationFailureKind.SelfTargetRejected => new(
                StatusCodes.Status409Conflict,
                "Tenant impersonation self-target rejected.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationSelfTargetRejected),

            TenantImpersonationFailureKind.AlreadyActive => new(
                StatusCodes.Status409Conflict,
                "Tenant impersonation already active.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationAlreadyActive),

            TenantImpersonationFailureKind.NotActive => new(
                StatusCodes.Status409Conflict,
                "Tenant impersonation not active.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationNotActive),

            TenantImpersonationFailureKind.SessionConflict => new(
                StatusCodes.Status409Conflict,
                "Tenant impersonation session conflict.",
                failure.Detail,
                PaperBinderErrorCodes.TenantImpersonationSessionConflict),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown tenant impersonation failure.")
        };
}
