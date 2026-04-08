using PaperBinder.Api;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Persistence;

public partial class Program
{
    public static WebApplication BuildApp(
        string[] args,
        string? environmentName = null,
        IReadOnlyDictionary<string, string?>? configurationOverrides = null)
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
        builder.Services.AddPaperBinderHttpContract();
        builder.Services.AddPaperBinderAuthentication(runtimeSettings);
        builder.Services.AddPaperBinderTenancy();
        builder.Services.AddSingleton<IDatabaseReadinessProbe, DatabaseReadinessProbe>();

        var app = builder.Build();

        app.UsePaperBinderHttpContract();
        app.UsePaperBinderAuthentication();
        app.UsePaperBinderTenancy();
        app.UsePaperBinderApiProtection();
        app.MapPaperBinderHealthEndpoints();
        app.MapPaperBinderAuthEndpoints();
        app.MapPaperBinderTenantUserEndpoints();
        app.MapPaperBinderBinderEndpoints();
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
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.MapFallbackToFile("index.html");
            return;
        }

        app.MapGet("/", () => Results.Content(
            BackendLandingPage.Render(app.Environment.EnvironmentName),
            "text/html"));
    }
}
