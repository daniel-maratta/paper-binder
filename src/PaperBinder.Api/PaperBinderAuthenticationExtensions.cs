using System.IO;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Provisioning;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Identity;
using PaperBinder.Infrastructure.Provisioning;
using PaperBinder.Infrastructure.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderAuthenticationExtensions
{
    public static IServiceCollection AddPaperBinderAuthentication(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);

        services.AddHttpContextAccessor();
        services.AddDataProtection()
            .SetApplicationName("PaperBinder")
            .PersistKeysToFileSystem(new DirectoryInfo(Path.GetFullPath(runtimeSettings.AuthCookie.KeyRingPath)));

        services
            .AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddCookie(IdentityConstants.ApplicationScheme, options =>
            {
                options.Cookie.Name = runtimeSettings.AuthCookie.Name;
                options.Cookie.Domain = runtimeSettings.AuthCookie.Domain;
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
                options.Cookie.Path = "/";
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = string.Equals(
                    runtimeSettings.PublicUrl.RootUrl.Scheme,
                    Uri.UriSchemeHttps,
                    StringComparison.OrdinalIgnoreCase)
                    ? CookieSecurePolicy.Always
                    : CookieSecurePolicy.SameAsRequest;
                options.Events = new CookieAuthenticationEvents
                {
                    OnRedirectToLogin = context => WriteApiAuthFailureAsync(
                        context,
                        StatusCodes.Status401Unauthorized,
                        "Authentication required.",
                        "The request requires an authenticated session."),
                    OnRedirectToAccessDenied = context => WriteApiAuthFailureAsync(
                        context,
                        StatusCodes.Status403Forbidden,
                        "Access denied.",
                        "The request is not authorized.")
                };
            });

        services.AddPaperBinderAuthorization();
        services.AddPaperBinderPreAuthProtection(runtimeSettings);

        services
            .AddIdentityCore<PaperBinderUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.Lockout.AllowedForNewUsers = false;
            })
            .AddSignInManager();

        services.AddScoped<PaperBinderCsrfCookieService>();
        services.AddScoped<ITenantProvisioningService, DapperTenantProvisioningService>();
        services.AddScoped<ITenantUserAdministrationService, DapperTenantUserAdministrationService>();

        return services;
    }

    public static void UsePaperBinderAuthentication(this WebApplication app)
    {
        app.UseAuthentication();
    }

    public static void UsePaperBinderApiProtection(this WebApplication app)
    {
        app.UsePaperBinderPreAuthProtection();
        app.UseMiddleware<PaperBinderEndpointHostRequirementMiddleware>();
        app.UseMiddleware<PaperBinderCsrfMiddleware>();
        app.UseAuthorization();
    }

    private static Task WriteApiAuthFailureAsync(
        RedirectContext<CookieAuthenticationOptions> context,
        int statusCode,
        string title,
        string detail)
    {
        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path))
        {
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        }

        if (context.Response.HasStarted)
        {
            return Task.CompletedTask;
        }

        return PaperBinderProblemDetails.WriteApiProblemAsync(
            context.HttpContext,
            context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>(),
            statusCode,
            title,
            detail);
    }
}
