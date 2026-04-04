using Microsoft.AspNetCore.Mvc;

namespace PaperBinder.Api;

internal sealed class PaperBinderCsrfMiddleware(
    RequestDelegate next,
    IProblemDetailsService problemDetailsService)
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
