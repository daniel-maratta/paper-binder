using PaperBinder.Api;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Persistence;

public partial class Program
{
    private const string E2ETurnstileScriptPathConfigurationKey = "PAPERBINDER_E2E_TURNSTILE_SCRIPT_PATH";

    public static WebApplication BuildApp(
        string[] args,
        string? environmentName = null,
        IReadOnlyDictionary<string, string?>? configurationOverrides = null,
        Action<IServiceCollection>? configureServices = null)
    {
        LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(Directory.GetCurrentDirectory());

        var options = new WebApplicationOptions
        {
            Args = args,
            EnvironmentName = environmentName
        };

        var builder = WebApplication.CreateBuilder(options);

        if (configurationOverrides is not null)
        {
            builder.Configuration.AddInMemoryCollection(configurationOverrides);
        }

        var runtimeSettings = PaperBinderRuntimeSettings.Load(key => builder.Configuration[key]);

        builder.Services.AddSingleton(runtimeSettings);
        builder.Services.AddPaperBinderPersistence(runtimeSettings);
        builder.Services.AddPaperBinderObservability(runtimeSettings, builder.Environment);
        builder.Services.AddPaperBinderHttpContract();
        builder.Services.AddPaperBinderAuthentication(runtimeSettings);
        builder.Services.AddPaperBinderTenancy();
        builder.Services.AddSingleton<IDatabaseReadinessProbe, DatabaseReadinessProbe>();
        configureServices?.Invoke(builder.Services);

        var app = builder.Build();

        app.UsePaperBinderHttpContract();
        app.UsePaperBinderAuthentication();
        app.UsePaperBinderTenancy();
        app.UsePaperBinderApiProtection();
        app.MapPaperBinderHealthEndpoints();
        app.MapPaperBinderAuthEndpoints();
        app.MapPaperBinderTenantLeaseEndpoints();
        app.MapPaperBinderImpersonationEndpoints();
        app.MapPaperBinderTenantUserEndpoints();
        app.MapPaperBinderBinderEndpoints();
        app.MapPaperBinderDocumentEndpoints();
        app.MapPaperBinderApiFallback();
        MapFrontendSurface(app);

        return app;
    }

    private static void MapFrontendSurface(WebApplication app)
    {
        var webRootPath = app.Environment.WebRootPath
            ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
        var frontendEntryPoint = Path.Combine(webRootPath, "index.html");
        var requestedHostingMode = app.Configuration[FrontendHostingPolicy.HostingModeConfigurationKey];
        var hasFrontendEntryPoint = File.Exists(frontendEntryPoint);

        if (FrontendHostingPolicy.RequiresCompiledFrontend(requestedHostingMode) && !hasFrontendEntryPoint)
        {
            throw new InvalidOperationException(
                $"Compiled frontend hosting was requested via {FrontendHostingPolicy.HostingModeConfigurationKey}, " +
                $"but {frontendEntryPoint} does not exist. Build the solution so the frontend assets are copied into wwwroot.");
        }

        var shouldServeCompiledFrontend = FrontendHostingPolicy.ShouldServeCompiledFrontend(
            app.Environment.EnvironmentName,
            hasFrontendEntryPoint,
            requestedHostingMode);

        if (shouldServeCompiledFrontend)
        {
            MapE2ETurnstileFixture(app);
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.MapFallbackToFile("index.html");
            return;
        }

        app.MapGet("/", () => Results.Content(
            BackendLandingPage.Render(app.Environment.EnvironmentName),
            "text/html"));
    }

    private static void MapE2ETurnstileFixture(WebApplication app)
    {
        if (!string.Equals(
                app.Configuration[PaperBinderChallengeVerification.TestEnvironmentVariableName],
                PaperBinderChallengeVerification.TestEnvironmentValue,
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var scriptPath = app.Configuration[E2ETurnstileScriptPathConfigurationKey];
        if (string.IsNullOrWhiteSpace(scriptPath) || !File.Exists(scriptPath))
        {
            return;
        }

        app.MapGet(
            "/e2e-turnstile.js",
            () => Results.File(scriptPath, "text/javascript; charset=utf-8"));
    }
}
