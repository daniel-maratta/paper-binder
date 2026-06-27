using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Provisioning;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;
using PaperBinder.Infrastructure.Identity;
using PaperBinder.Infrastructure.Provisioning;
using PaperBinder.Infrastructure.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderAuthenticationExtensions
{
    internal const string DefaultDataProtectionApplicationName = "PaperBinder";

    public static IServiceCollection AddPaperBinderAuthentication(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings,
        IHostEnvironment hostEnvironment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);
        ArgumentNullException.ThrowIfNull(hostEnvironment);

        services.AddHttpContextAccessor();
        services.AddPaperBinderDataProtection(runtimeSettings, hostEnvironment);

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
        services.AddScoped<IPaperBinderImpersonationService, PaperBinderImpersonationService>();
        services.AddScoped<ITenantProvisioningService, DapperTenantProvisioningService>();
        services.AddScoped<ITenantUserAdministrationService, DapperTenantUserAdministrationService>();

        return services;
    }

    internal static IDataProtectionBuilder AddPaperBinderDataProtection(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings,
        IHostEnvironment hostEnvironment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);
        ArgumentNullException.ThrowIfNull(hostEnvironment);

        if (RequiresCertificateConfiguration(runtimeSettings, hostEnvironment) &&
            !runtimeSettings.DataProtection.HasCertificateConfiguration)
        {
            throw new InvalidOperationException(
                $"Configuration keys `{PaperBinderConfigurationKeys.DataProtectionCertificatePath}` and " +
                $"`{PaperBinderConfigurationKeys.DataProtectionCertificatePassword}` are required when " +
                $"`{PaperBinderConfigurationKeys.AuthKeyRingPath}` is configured for deployed environment " +
                $"`{hostEnvironment.EnvironmentName}`.");
        }

        var dataProtectionBuilder = services.AddDataProtection()
            .SetApplicationName(
                string.IsNullOrWhiteSpace(runtimeSettings.DataProtection.ApplicationName)
                    ? DefaultDataProtectionApplicationName
                    : runtimeSettings.DataProtection.ApplicationName)
            .PersistKeysToFileSystem(new DirectoryInfo(Path.GetFullPath(runtimeSettings.AuthCookie.KeyRingPath)));

        if (!runtimeSettings.DataProtection.HasCertificateConfiguration)
        {
            return dataProtectionBuilder;
        }

        dataProtectionBuilder.ProtectKeysWithCertificate(LoadCertificate(runtimeSettings.DataProtection));
        return dataProtectionBuilder;
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
        app.UseMiddleware<PaperBinderAuthenticatedMutationRateLimitMiddleware>();
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

        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(PaperBinderAuthenticationExtensions).FullName!);
        var reason = statusCode == StatusCodes.Status401Unauthorized
            ? PaperBinderTelemetry.SecurityDenialReasons.AuthenticationRequired
            : PaperBinderTelemetry.SecurityDenialReasons.AccessDenied;

        PaperBinderTelemetry.RecordSecurityDenial(reason, PaperBinderTelemetry.SecurityDenialSurfaces.Authorization);
        logger.LogWarning(
            "API authentication boundary rejected request. event_name={event_name} reason={reason} surface={surface} status_code={status_code} path={path} host={host} correlation_id={correlation_id}",
            "security_denial",
            reason,
            PaperBinderTelemetry.SecurityDenialSurfaces.Authorization,
            statusCode,
            context.Request.Path.Value ?? string.Empty,
            context.Request.Host.Host,
            PaperBinderRequestCorrelation.Get(context.HttpContext) ?? string.Empty);

        return PaperBinderProblemDetails.WriteApiProblemAsync(
            context.HttpContext,
            context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>(),
            statusCode,
            title,
            detail);
    }

    private static bool RequiresCertificateConfiguration(
        PaperBinderRuntimeSettings runtimeSettings,
        IHostEnvironment hostEnvironment) =>
        !string.IsNullOrWhiteSpace(runtimeSettings.AuthCookie.KeyRingPath) &&
        !hostEnvironment.IsDevelopment() &&
        !string.Equals(hostEnvironment.EnvironmentName, "Local", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(hostEnvironment.EnvironmentName, "Test", StringComparison.OrdinalIgnoreCase);

    private static X509Certificate2 LoadCertificate(DataProtectionSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        var certificatePath = settings.CertificatePath!;
        if (!File.Exists(certificatePath))
        {
            throw new InvalidOperationException(
                $"Configuration key `{PaperBinderConfigurationKeys.DataProtectionCertificatePath}` points to `{certificatePath}`, but the certificate file does not exist.");
        }

        try
        {
            return X509CertificateLoader.LoadPkcs12FromFile(
                certificatePath,
                settings.CertificatePassword,
                X509KeyStorageFlags.EphemeralKeySet,
                Pkcs12LoaderLimits.Defaults);
        }
        catch (CryptographicException ex)
        {
            throw new InvalidOperationException(
                $"Failed to load the Data Protection certificate from `{PaperBinderConfigurationKeys.DataProtectionCertificatePath}`. Verify the `.pfx` file and password.",
                ex);
        }
    }
}
