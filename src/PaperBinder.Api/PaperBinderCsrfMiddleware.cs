using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Api;

internal sealed class PaperBinderCsrfMiddleware(
    RequestDelegate next,
    IProblemDetailsService problemDetailsService,
    ILogger<PaperBinderCsrfMiddleware> logger)
{
    public async Task InvokeAsync(
        HttpContext context,
        PaperBinderCsrfCookieService csrfCookieService,
        IRequestResolvedTenantHostContext requestHostContext)
    {
        if (!ShouldValidateRequest(context, requestHostContext, csrfCookieService))
        {
            await next(context);
            return;
        }

        if (PaperBinderCsrfProtection.IsValid(
            context.Request.Cookies[csrfCookieService.CookieName],
            context.Request.Headers[PaperBinderCsrfProtection.HeaderName]))
        {
            await next(context);
            return;
        }

        PaperBinderTelemetry.RecordSecurityDenial(
            PaperBinderTelemetry.SecurityDenialReasons.CsrfTokenInvalid,
            PaperBinderTelemetry.SecurityDenialSurfaces.Csrf);
        logger.LogWarning(
            "CSRF protection rejected request. event_name={event_name} reason={reason} surface={surface} path={path} host={host} correlation_id={correlation_id}",
            "security_denial",
            PaperBinderTelemetry.SecurityDenialReasons.CsrfTokenInvalid,
            PaperBinderTelemetry.SecurityDenialSurfaces.Csrf,
            context.Request.Path.Value ?? string.Empty,
            context.Request.Host.Host,
            PaperBinderRequestCorrelation.Get(context) ?? string.Empty);

        await PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            StatusCodes.Status403Forbidden,
            "CSRF token invalid.",
            "The request is missing a valid CSRF token.",
            PaperBinderErrorCodes.CsrfTokenInvalid);
    }

    private static bool ShouldValidateRequest(
        HttpContext context,
        IRequestResolvedTenantHostContext requestHostContext,
        PaperBinderCsrfCookieService csrfCookieService)
    {
        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path) ||
            HttpMethods.IsGet(context.Request.Method) ||
            HttpMethods.IsHead(context.Request.Method) ||
            HttpMethods.IsOptions(context.Request.Method) ||
            HttpMethods.IsTrace(context.Request.Method) ||
            context.User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        if (PaperBinderAuthRoutes.IsRootHostPreAuthRoute(context.Request.Path))
        {
            return false;
        }

        if (PaperBinderAuthRoutes.IsLogoutRoute(context.Request.Path) &&
            !requestHostContext.IsTenantHost)
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(csrfCookieService.CookieName);
    }
}
