using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.Api;

internal static class PaperBinderAuthEndpoints
{
    public static void MapPaperBinderAuthEndpoints(this WebApplication app)
    {
        app.MapPost(PaperBinderAuthRoutes.LoginPath, LoginAsync);
        app.MapPost(PaperBinderAuthRoutes.LogoutPath, LogoutAsync);
    }

    private static async Task LoginAsync(
        HttpContext context,
        UserManager<PaperBinderUser> userManager,
        SignInManager<PaperBinderUser> signInManager,
        ITenantMembershipLookupService tenantMembershipLookupService,
        IProblemDetailsService problemDetailsService,
        IRequestResolvedTenantHostContext requestHostContext,
        PaperBinderCsrfCookieService csrfCookieService,
        PaperBinderRuntimeSettings runtimeSettings,
        PaperBinder.Application.Time.ISystemClock clock,
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (!PaperBinderAuthEndpointHostPolicy.AllowsLogin(requestHostContext))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status404NotFound);
            return;
        }

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            await WriteInvalidCredentialsAsync(context, problemDetailsService);
            return;
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            await WriteInvalidCredentialsAsync(context, problemDetailsService);
            return;
        }

        var signInResult = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!signInResult.Succeeded)
        {
            await WriteInvalidCredentialsAsync(context, problemDetailsService);
            return;
        }

        var membership = await tenantMembershipLookupService.FindSingleMembershipAsync(user.Id, cancellationToken);
        if (membership is null)
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status403Forbidden,
                "Tenant access denied.",
                "The authenticated user does not belong to an active tenant.",
                PaperBinderErrorCodes.TenantForbidden);
            return;
        }

        if (membership.TenantHost.ExpiresAtUtc <= clock.UtcNow)
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status410Gone,
                "Tenant expired.",
                "The authenticated tenant has expired and can no longer be accessed.",
                PaperBinderErrorCodes.TenantExpired);
            return;
        }

        await signInManager.SignOutAsync();
        await signInManager.SignInAsync(user, isPersistent: false);
        csrfCookieService.IssueToken(context);

        context.Response.StatusCode = StatusCodes.Status200OK;
        await context.Response.WriteAsJsonAsync(
            new LoginResponse(
                PaperBinderTenantRedirectUrlBuilder
                    .Build(runtimeSettings.PublicUrl.RootUrl, membership.TenantHost.Tenant.TenantSlug)
                    .ToString()),
            cancellationToken);
    }

    private static async Task LogoutAsync(
        HttpContext context,
        SignInManager<PaperBinderUser> signInManager,
        IRequestResolvedTenantHostContext requestHostContext,
        PaperBinderCsrfCookieService csrfCookieService,
        IProblemDetailsService problemDetailsService)
    {
        if (!PaperBinderAuthEndpointHostPolicy.AllowsLogout(requestHostContext))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status404NotFound);
            return;
        }

        if (context.User.Identity?.IsAuthenticated != true)
        {
            await context.ChallengeAsync(IdentityConstants.ApplicationScheme);
            return;
        }

        if (!PaperBinderCsrfProtection.IsValid(
            context.Request.Cookies[csrfCookieService.CookieName],
            context.Request.Headers[PaperBinderCsrfProtection.HeaderName]))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status403Forbidden,
                "CSRF token invalid.",
                "The request is missing a valid CSRF token.",
                PaperBinderErrorCodes.CsrfTokenInvalid);
            return;
        }

        await signInManager.SignOutAsync();
        csrfCookieService.ClearToken(context);
        context.Response.StatusCode = StatusCodes.Status204NoContent;
    }

    private static Task WriteInvalidCredentialsAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService) =>
        PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            StatusCodes.Status401Unauthorized,
            "Invalid credentials.",
            "The supplied email or password is invalid.",
            PaperBinderErrorCodes.InvalidCredentials);

    internal sealed record LoginRequest(
        string Email,
        string Password,
        string? ChallengeToken = null);

    internal sealed record LoginResponse(
        string RedirectUrl);
}
