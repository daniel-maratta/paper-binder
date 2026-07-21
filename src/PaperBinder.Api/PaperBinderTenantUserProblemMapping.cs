using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderTenantUserProblemMapping
{
    public static PaperBinderApiProblem Map(TenantUserAdministrationFailure failure) =>
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

            TenantUserAdministrationFailureKind.LimitReached => new(
                StatusCodes.Status409Conflict,
                "Tenant user limit reached.",
                failure.Detail,
                PaperBinderErrorCodes.TenantUserLimitReached),

            TenantUserAdministrationFailureKind.LastTenantAdminRequired => new(
                StatusCodes.Status409Conflict,
                "Tenant admin required.",
                failure.Detail,
                PaperBinderErrorCodes.LastTenantAdminRequired),

            TenantUserAdministrationFailureKind.LastTenantOwnerRequired => new(
                StatusCodes.Status409Conflict,
                "The workspace owner cannot be deleted.",
                failure.Detail,
                PaperBinderErrorCodes.LastTenantOwnerRequired),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown tenant-user failure.")
        };
}
