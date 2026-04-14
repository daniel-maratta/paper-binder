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
    public const string TenantLeaseExtensionWindowNotOpen = "TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN";
    public const string TenantLeaseExtensionLimitReached = "TENANT_LEASE_EXTENSION_LIMIT_REACHED";
    public const string TenantUserNotFound = "TENANT_USER_NOT_FOUND";
    public const string TenantUserEmailConflict = "TENANT_USER_EMAIL_CONFLICT";
    public const string LastTenantAdminRequired = "LAST_TENANT_ADMIN_REQUIRED";
    public const string TenantRoleInvalid = "TENANT_ROLE_INVALID";
    public const string TenantUserPasswordInvalid = "TENANT_USER_PASSWORD_INVALID";
    public const string BinderNameInvalid = "BINDER_NAME_INVALID";
    public const string BinderNotFound = "BINDER_NOT_FOUND";
    public const string BinderPolicyInvalid = "BINDER_POLICY_INVALID";
    public const string BinderPolicyDenied = "BINDER_POLICY_DENIED";
    public const string DocumentNotFound = "DOCUMENT_NOT_FOUND";
    public const string DocumentTitleInvalid = "DOCUMENT_TITLE_INVALID";
    public const string DocumentContentRequired = "DOCUMENT_CONTENT_REQUIRED";
    public const string DocumentContentTooLarge = "DOCUMENT_CONTENT_TOO_LARGE";
    public const string DocumentContentTypeInvalid = "DOCUMENT_CONTENT_TYPE_INVALID";
    public const string DocumentBinderRequired = "DOCUMENT_BINDER_REQUIRED";
    public const string DocumentSupersedesInvalid = "DOCUMENT_SUPERSEDES_INVALID";
    public const string DocumentAlreadyArchived = "DOCUMENT_ALREADY_ARCHIVED";
    public const string DocumentNotArchived = "DOCUMENT_NOT_ARCHIVED";
}
