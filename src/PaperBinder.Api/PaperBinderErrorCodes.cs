namespace PaperBinder.Api;

internal static class PaperBinderErrorCodes
{
    public const string ChallengeRequired = "CHALLENGE_REQUIRED";
    public const string ChallengeFailed = "CHALLENGE_FAILED";
    public const string RateLimited = "RATE_LIMITED";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string CsrfTokenInvalid = "CSRF_TOKEN_INVALID";
    public const string TenantNameInvalid = "TENANT_NAME_INVALID";
    public const string TenantNameConflict = "TENANT_NAME_CONFLICT";
    public const string TenantForbidden = "TENANT_FORBIDDEN";
    public const string TenantExpired = "TENANT_EXPIRED";
    public const string TenantHostInvalid = "TENANT_HOST_INVALID";
    public const string TenantNotFound = "TENANT_NOT_FOUND";
    public const string TenantUserNotFound = "TENANT_USER_NOT_FOUND";
    public const string TenantUserEmailConflict = "TENANT_USER_EMAIL_CONFLICT";
    public const string LastTenantAdminRequired = "LAST_TENANT_ADMIN_REQUIRED";
    public const string TenantRoleInvalid = "TENANT_ROLE_INVALID";
    public const string TenantUserPasswordInvalid = "TENANT_USER_PASSWORD_INVALID";
    public const string BinderNameInvalid = "BINDER_NAME_INVALID";
    public const string BinderNotFound = "BINDER_NOT_FOUND";
    public const string BinderPolicyInvalid = "BINDER_POLICY_INVALID";
    public const string BinderPolicyDenied = "BINDER_POLICY_DENIED";
}
