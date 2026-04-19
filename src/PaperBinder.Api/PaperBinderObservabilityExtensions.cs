using Microsoft.Extensions.Hosting;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Api;

internal static class PaperBinderObservabilityExtensions
{
    public static IServiceCollection AddPaperBinderObservability(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings,
        IHostEnvironment hostEnvironment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);
        ArgumentNullException.ThrowIfNull(hostEnvironment);

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService("PaperBinder.Api"))
            .WithTracing(tracing =>
            {
                tracing.AddAspNetCoreInstrumentation();
                tracing.AddSource(PaperBinderTelemetry.ActivitySourceName);

                if (ShouldUseConsoleExporter(hostEnvironment))
                {
                    tracing.AddConsoleExporter();
                }

                if (runtimeSettings.Observability.OtlpEndpoint is { } endpoint)
                {
                    tracing.AddOtlpExporter(options => options.Endpoint = endpoint);
                }
            })
            .WithMetrics(metrics =>
            {
                metrics.AddMeter(PaperBinderTelemetry.MeterName);

                if (ShouldUseConsoleExporter(hostEnvironment))
                {
                    metrics.AddConsoleExporter();
                }

                if (runtimeSettings.Observability.OtlpEndpoint is { } endpoint)
                {
                    metrics.AddOtlpExporter(options => options.Endpoint = endpoint);
                }
            });

        return services;
    }

    private static bool ShouldUseConsoleExporter(IHostEnvironment hostEnvironment) =>
        hostEnvironment.IsDevelopment() ||
        string.Equals(hostEnvironment.EnvironmentName, "Test", StringComparison.OrdinalIgnoreCase);
}
