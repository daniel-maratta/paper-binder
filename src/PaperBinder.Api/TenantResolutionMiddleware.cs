using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using PaperBinder.Application.Time;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal sealed class TenantResolutionMiddleware(
    RequestDelegate next,
    IHostEnvironment hostEnvironment)
{
    public async Task InvokeAsync(
        HttpContext context,
        PaperBinderRuntimeSettings runtimeSettings,
        IRequestTenantContextSetter tenantContextSetter,
        IRequestTenantMembershipContextSetter tenantMembershipContextSetter,
        IRequestResolvedTenantHostContextSetter requestHostContextSetter,
        ITenantLookupService tenantLookupService,
        ITenantMembershipLookupService tenantMembershipLookupService,
        ISystemClock clock,
        IProblemDetailsService problemDetailsService)
    {
        var hostMatch = PaperBinderTenantHostResolution.Resolve(
            runtimeSettings.AuthCookie.Domain,
            context.Request.Host.Host,
            allowLoopbackHosts: AllowsLoopbackHosts(hostEnvironment));

        switch (hostMatch.Kind)
        {
            case PaperBinderTenantHostMatchKind.System:
                requestHostContextSetter.EstablishSystemHost();
                tenantContextSetter.EstablishSystem();
                await next(context);
                return;

            case PaperBinderTenantHostMatchKind.Tenant:
                var tenant = await tenantLookupService.FindBySlugAsync(hostMatch.TenantSlug!, context.RequestAborted);
                if (tenant is null)
                {
                    await RejectAsync(
                        context,
                        problemDetailsService,
                        StatusCodes.Status404NotFound,
                        "Tenant not found.",
                        "The requested tenant host does not map to an active PaperBinder tenant.",
                        PaperBinderErrorCodes.TenantNotFound);
                    return;
                }

                requestHostContextSetter.EstablishTenantHost(tenant);

                if (context.User.Identity?.IsAuthenticated == true)
                {
                    if (!PaperBinderAuthenticatedUser.TryGetUserId(context.User, out var userId))
                    {
                        await PaperBinderProblemDetails.WriteApiProblemAsync(
                            context,
                            problemDetailsService,
                            StatusCodes.Status401Unauthorized,
                            "Authentication required.",
                            "The request requires a valid authenticated session.");
                        return;
                    }

                    var membership = await tenantMembershipLookupService.FindMembershipAsync(
                        userId,
                        tenant.Tenant.TenantId,
                        context.RequestAborted);

                    if (membership is null)
                    {
                        await RejectAsync(
                            context,
                            problemDetailsService,
                            StatusCodes.Status403Forbidden,
                            "Tenant access denied.",
                            "The authenticated user does not belong to the requested tenant.",
                            PaperBinderErrorCodes.TenantForbidden);
                        return;
                    }

                    if (tenant.ExpiresAtUtc <= clock.UtcNow)
                    {
                        await RejectAsync(
                            context,
                            problemDetailsService,
                            StatusCodes.Status410Gone,
                            "Tenant expired.",
                            "The requested tenant has expired and can no longer be accessed.",
                            PaperBinderErrorCodes.TenantExpired);
                        return;
                    }

                    tenantContextSetter.EstablishTenant(tenant.Tenant);
                    tenantMembershipContextSetter.Establish(membership);
                }

                await next(context);
                return;

            default:
                await RejectAsync(
                    context,
                    problemDetailsService,
                    StatusCodes.Status400BadRequest,
                    "Invalid tenant host.",
                    "The request host is not a valid PaperBinder root or tenant host.",
                    PaperBinderErrorCodes.TenantHostInvalid);
                return;
        }
    }

    private static bool AllowsLoopbackHosts(IHostEnvironment hostEnvironment) =>
        hostEnvironment.IsDevelopment() ||
        string.Equals(hostEnvironment.EnvironmentName, "Test", StringComparison.OrdinalIgnoreCase);

    private static async Task RejectAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        int statusCode,
        string title,
        string detail,
        string errorCode)
    {
        if (PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                statusCode,
                title,
                detail,
                errorCode);
            return;
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.WriteAsync(TenantHostFailurePage.Render(title, detail));
    }
}
