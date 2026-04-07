using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal sealed record TenantUserProblemContract(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);

internal static class PaperBinderTenantUserProblemMapping
{
    public static TenantUserProblemContract Map(TenantUserAdministrationFailure failure) =>
        failure.Kind switch
        {
            TenantUserAdministrationFailureKind.UserNotFound => new(
                StatusCodes.Status404NotFound,
                "Tenant user not found.",
                failure.Detail,
                PaperBinderErrorCodes.TenantUserNotFound),

            TenantUserAdministrationFailureKind.EmailConflict => new(
                StatusCodes.Status409Conflict,
                "Tenant user email conflict.",
                failure.Detail,
                PaperBinderErrorCodes.TenantUserEmailConflict),

            TenantUserAdministrationFailureKind.InvalidRole => new(
                StatusCodes.Status422UnprocessableEntity,
                "Tenant role invalid.",
                failure.Detail,
                PaperBinderErrorCodes.TenantRoleInvalid),

            TenantUserAdministrationFailureKind.InvalidPassword => new(
                StatusCodes.Status422UnprocessableEntity,
                "Tenant user password invalid.",
                failure.Detail,
                PaperBinderErrorCodes.TenantUserPasswordInvalid),

            TenantUserAdministrationFailureKind.LastTenantAdminRequired => new(
                StatusCodes.Status409Conflict,
                "Tenant admin required.",
                failure.Detail,
                PaperBinderErrorCodes.LastTenantAdminRequired),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown tenant-user failure.")
        };
}
