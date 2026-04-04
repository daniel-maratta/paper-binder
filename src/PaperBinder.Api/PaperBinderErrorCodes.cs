namespace PaperBinder.Api;

internal static class PaperBinderErrorCodes
{
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string CsrfTokenInvalid = "CSRF_TOKEN_INVALID";
    public const string TenantForbidden = "TENANT_FORBIDDEN";
    public const string TenantExpired = "TENANT_EXPIRED";
    public const string TenantHostInvalid = "TENANT_HOST_INVALID";
    public const string TenantNotFound = "TENANT_NOT_FOUND";
}
