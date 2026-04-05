using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Provisioning;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.Api;

internal static class PaperBinderAuthEndpoints
{
    public static void MapPaperBinderAuthEndpoints(this WebApplication app)
    {
        app.MapPost(PaperBinderAuthRoutes.LoginPath, LoginAsync)
            .RequireRateLimiting(PaperBinderPreAuthProtectionExtensions.RootHostPreAuthPolicyName);
        app.MapPost(PaperBinderAuthRoutes.ProvisionPath, ProvisionAsync)
            .RequireRateLimiting(PaperBinderPreAuthProtectionExtensions.RootHostPreAuthPolicyName);
        app.MapPost(PaperBinderAuthRoutes.LogoutPath, LogoutAsync);
    }

    private static async Task LoginAsync(
        HttpContext context,
        UserManager<PaperBinderUser> userManager,
        SignInManager<PaperBinderUser> signInManager,
        ITenantMembershipLookupService tenantMembershipLookupService,
        IChallengeVerificationService challengeVerificationService,
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

        if (!await RequireValidChallengeAsync(
                context,
                problemDetailsService,
                challengeVerificationService,
                request.ChallengeToken,
                cancellationToken))
        {
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

    private static async Task ProvisionAsync(
        HttpContext context,
        UserManager<PaperBinderUser> userManager,
        SignInManager<PaperBinderUser> signInManager,
        ITenantProvisioningService tenantProvisioningService,
        IChallengeVerificationService challengeVerificationService,
        IProblemDetailsService problemDetailsService,
        IRequestResolvedTenantHostContext requestHostContext,
        PaperBinderCsrfCookieService csrfCookieService,
        PaperBinderRuntimeSettings runtimeSettings,
        ProvisionRequest request,
        CancellationToken cancellationToken)
    {
        if (!PaperBinderAuthEndpointHostPolicy.AllowsProvision(requestHostContext))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status404NotFound);
            return;
        }

        if (!await RequireValidChallengeAsync(
                context,
                problemDetailsService,
                challengeVerificationService,
                request.ChallengeToken,
                cancellationToken))
        {
            return;
        }

        var outcome = await tenantProvisioningService.ProvisionAsync(request.TenantName, cancellationToken);
        if (!outcome.Succeeded)
        {
            await WriteProvisionFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        var provisionedTenant = outcome.ProvisionedTenant!;
        var user = await userManager.FindByIdAsync(provisionedTenant.OwnerUserId.ToString("D"));
        if (user is null)
        {
            throw new InvalidOperationException(
                $"Provisioning completed without a persisted owner user for tenant {provisionedTenant.TenantId:D}.");
        }

        await signInManager.SignOutAsync();
        await signInManager.SignInAsync(user, isPersistent: false);
        csrfCookieService.IssueToken(context);

        context.Response.StatusCode = StatusCodes.Status201Created;
        await context.Response.WriteAsJsonAsync(
            new ProvisionResponse(
                provisionedTenant.TenantId,
                provisionedTenant.TenantSlug,
                provisionedTenant.ExpiresAtUtc,
                PaperBinderTenantRedirectUrlBuilder
                    .Build(runtimeSettings.PublicUrl.RootUrl, provisionedTenant.TenantSlug)
                    .ToString(),
                new ProvisionCredentials(
                    provisionedTenant.OwnerEmail,
                    provisionedTenant.GeneratedPassword)),
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

    private static async Task<bool> RequireValidChallengeAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        IChallengeVerificationService challengeVerificationService,
        string? challengeToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(challengeToken))
        {
            context.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger(typeof(PaperBinderAuthEndpoints).FullName!)
                .LogWarning(
                    "Pre-auth request was rejected because the challenge token was missing. Path={Path} Host={Host} RemoteIp={RemoteIp}",
                    context.Request.Path.Value ?? string.Empty,
                    context.Request.Host.Host,
                    context.Connection.RemoteIpAddress?.ToString() ?? "unknown");

            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status400BadRequest,
                "Challenge required.",
                "The request must include a valid challenge token.",
                PaperBinderErrorCodes.ChallengeRequired);
            return false;
        }

        var isValid = await challengeVerificationService.VerifyAsync(
            challengeToken,
            context.Connection.RemoteIpAddress,
            cancellationToken);

        if (isValid)
        {
            return true;
        }

        await PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            StatusCodes.Status403Forbidden,
            "Challenge verification failed.",
            "The submitted challenge token could not be verified. Retry the challenge and submit again.",
            PaperBinderErrorCodes.ChallengeFailed);
        return false;
    }

    private static Task WriteProvisionFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        TenantProvisioningFailure failure) =>
        failure.Kind switch
        {
            TenantProvisioningFailureKind.InvalidTenantName => PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status400BadRequest,
                "Tenant name invalid.",
                failure.Detail,
                PaperBinderErrorCodes.TenantNameInvalid),

            TenantProvisioningFailureKind.TenantNameConflict => PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status409Conflict,
                "Tenant name unavailable.",
                failure.Detail,
                PaperBinderErrorCodes.TenantNameConflict),

            _ => throw new ArgumentOutOfRangeException(nameof(failure.Kind), failure.Kind, "Unknown provisioning failure.")
        };

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

    internal sealed record ProvisionRequest(
        string TenantName,
        string? ChallengeToken = null);

    internal sealed record LoginResponse(
        string RedirectUrl);

    internal sealed record ProvisionResponse(
        Guid TenantId,
        string TenantSlug,
        DateTimeOffset ExpiresAt,
        string RedirectUrl,
        ProvisionCredentials Credentials);

    internal sealed record ProvisionCredentials(
        string Email,
        string Password);
}
