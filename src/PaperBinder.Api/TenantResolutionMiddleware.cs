using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal sealed class TenantResolutionMiddleware(
    RequestDelegate next,
    IHostEnvironment hostEnvironment)
{
    public const string InvalidHostErrorCode = "TENANT_HOST_INVALID";
    public const string TenantNotFoundErrorCode = "TENANT_NOT_FOUND";

    public async Task InvokeAsync(
        HttpContext context,
        PaperBinderRuntimeSettings runtimeSettings,
        IRequestTenantContextSetter tenantContextSetter,
        ITenantLookupService tenantLookupService,
        IProblemDetailsService problemDetailsService)
    {
        var hostMatch = PaperBinderTenantHostResolution.Resolve(
            runtimeSettings.AuthCookie.Domain,
            context.Request.Host.Host,
            allowLoopbackHosts: AllowsLoopbackHosts(hostEnvironment));

        switch (hostMatch.Kind)
        {
            case PaperBinderTenantHostMatchKind.System:
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
                        TenantNotFoundErrorCode);
                    return;
                }

                tenantContextSetter.EstablishTenant(tenant);
                await next(context);
                return;

            default:
                await RejectAsync(
                    context,
                    problemDetailsService,
                    StatusCodes.Status400BadRequest,
                    "Invalid tenant host.",
                    "The request host is not a valid PaperBinder root or tenant host.",
                    InvalidHostErrorCode);
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
