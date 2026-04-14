using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Persistence;

namespace PaperBinder.Worker;

public static class PaperBinderWorkerHostBuilder
{
    public static IHost BuildHost(
        string[] args,
        string? environmentName = null,
        IReadOnlyDictionary<string, string?>? configurationOverrides = null,
        Action<IServiceCollection>? configureServices = null)
    {
        LocalDotEnvBootstrapper.LoadMissingEnvironmentVariables(Directory.GetCurrentDirectory());

        var options = new HostApplicationBuilderSettings
        {
            Args = args,
            EnvironmentName = environmentName
        };

        var builder = Host.CreateApplicationBuilder(options);

        if (configurationOverrides is not null)
        {
            builder.Configuration.AddInMemoryCollection(configurationOverrides);
        }

        var runtimeSettings = PaperBinderRuntimeSettings.Load(key => builder.Configuration[key]);

        builder.Services.AddSingleton(runtimeSettings);
        builder.Services.AddPaperBinderPersistence(runtimeSettings);
        builder.Services.AddPaperBinderWorkerRuntime();
        configureServices?.Invoke(builder.Services);

        return builder.Build();
    }

    public static IServiceCollection AddPaperBinderWorkerRuntime(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddHostedService<Worker>();
        return services;
    }
}
