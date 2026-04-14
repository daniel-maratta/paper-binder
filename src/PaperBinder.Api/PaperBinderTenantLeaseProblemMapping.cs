using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal sealed record TenantLeaseProblemContract(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);

internal static class PaperBinderTenantLeaseProblemMapping
{
    public static TenantLeaseProblemContract Map(TenantLeaseFailure failure) =>
        failure.Kind switch
        {
            TenantLeaseFailureKind.NotFound => new(
                StatusCodes.Status404NotFound,
                "Tenant not found.",
                failure.Detail,
                PaperBinderErrorCodes.TenantNotFound),

            TenantLeaseFailureKind.ExtensionWindowNotOpen => new(
                StatusCodes.Status409Conflict,
                "Tenant lease extension window not open.",
                failure.Detail,
                PaperBinderErrorCodes.TenantLeaseExtensionWindowNotOpen),

            TenantLeaseFailureKind.ExtensionLimitReached => new(
                StatusCodes.Status409Conflict,
                "Tenant lease extension limit reached.",
                failure.Detail,
                PaperBinderErrorCodes.TenantLeaseExtensionLimitReached),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown tenant lease failure.")
        };
}
