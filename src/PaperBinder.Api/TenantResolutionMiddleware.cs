using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using PaperBinder.Application.Time;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Identity;

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
        IRequestExecutionUserContextSetter executionUserContextSetter,
        IRequestResolvedTenantHostContextSetter requestHostContextSetter,
        ITenantLookupService tenantLookupService,
        ITenantMembershipLookupService tenantMembershipLookupService,
        IPaperBinderImpersonationService impersonationService,
        UserManager<PaperBinderUser> userManager,
        PaperBinderCsrfCookieService csrfCookieService,
        IOptions<IdentityOptions> identityOptions,
        PaperBinder.Application.Time.ISystemClock clock,
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

                if (context.User.Identity?.IsAuthenticated != true)
                {
                    await impersonationService.TryRecordExpiredImpersonationAsync(
                        context,
                        tenant,
                        context.RequestAborted);

                    await next(context);
                    return;
                }

                if (!PaperBinderAuthenticatedUser.TryGetUserId(context.User, out var actorUserId))
                {
                    await WriteAuthenticationRequiredAsync(context, problemDetailsService);
                    return;
                }

                if (!await IsCurrentActorSessionValidAsync(
                        context,
                        actorUserId,
                        userManager,
                        identityOptions.Value,
                        csrfCookieService))
                {
                    await WriteAuthenticationRequiredAsync(context, problemDetailsService);
                    return;
                }

                var effectiveUserId = actorUserId;
                Guid? impersonationSessionId = null;
                if (HasAnyImpersonationClaim(context.User))
                {
                    if (!PaperBinderImpersonationClaims.TryGetState(
                            context.User,
                            out effectiveUserId,
                            out var parsedSessionId))
                    {
                        await context.SignOutAsync(IdentityConstants.ApplicationScheme);
                        csrfCookieService.ClearToken(context);
                        await WriteAuthenticationRequiredAsync(context, problemDetailsService);
                        return;
                    }

                    impersonationSessionId = parsedSessionId;
                }

                var membership = await tenantMembershipLookupService.FindMembershipAsync(
                    effectiveUserId,
                    tenant.Tenant.TenantId,
                    context.RequestAborted);

                if (membership is null)
                {
                    await RejectAsync(
                        context,
                        problemDetailsService,
                        StatusCodes.Status403Forbidden,
                        "Tenant access denied.",
                        "The authenticated tenant session does not belong to the requested tenant.",
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
                executionUserContextSetter.Establish(actorUserId, effectiveUserId, impersonationSessionId);

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

    private static bool HasAnyImpersonationClaim(ClaimsPrincipal principal) =>
        principal.HasClaim(claim => claim.Type == PaperBinderImpersonationClaims.EffectiveUserIdClaimType) ||
        principal.HasClaim(claim => claim.Type == PaperBinderImpersonationClaims.SessionIdClaimType);

    private static async Task<bool> IsCurrentActorSessionValidAsync(
        HttpContext context,
        Guid actorUserId,
        UserManager<PaperBinderUser> userManager,
        IdentityOptions identityOptions,
        PaperBinderCsrfCookieService csrfCookieService)
    {
        if (!PaperBinderAuthenticatedUser.TryGetSecurityStamp(
                context.User,
                identityOptions.ClaimsIdentity.SecurityStampClaimType,
                out var presentedSecurityStamp))
        {
            await context.SignOutAsync(IdentityConstants.ApplicationScheme);
            csrfCookieService.ClearToken(context);
            return false;
        }

        var actorUser = await userManager.FindByIdAsync(actorUserId.ToString("D"));
        if (actorUser is null)
        {
            await context.SignOutAsync(IdentityConstants.ApplicationScheme);
            csrfCookieService.ClearToken(context);
            return false;
        }

        var persistedSecurityStamp = await userManager.GetSecurityStampAsync(actorUser);
        if (string.IsNullOrWhiteSpace(persistedSecurityStamp) ||
            !SecurityStampsMatch(presentedSecurityStamp, persistedSecurityStamp))
        {
            await context.SignOutAsync(IdentityConstants.ApplicationScheme);
            csrfCookieService.ClearToken(context);
            return false;
        }

        return true;
    }

    private static bool SecurityStampsMatch(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static Task WriteAuthenticationRequiredAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService) =>
        PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            StatusCodes.Status401Unauthorized,
            "Authentication required.",
            "The request requires a valid authenticated session.");

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
