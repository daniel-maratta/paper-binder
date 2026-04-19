using System.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Worker;

public sealed class Worker(
    IServiceScopeFactory serviceScopeFactory,
    PaperBinderRuntimeSettings runtimeSettings,
    ILogger<Worker> logger,
    ISystemClock clock) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var cleanupInterval = TimeSpan.FromSeconds(runtimeSettings.Lease.CleanupIntervalSeconds);
        logger.LogInformation(
            "PaperBinder.Worker service started. event_name={event_name} cleanup_interval_seconds={cleanup_interval_seconds}",
            "worker_started",
            runtimeSettings.Lease.CleanupIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            var cycleStartedAtUtc = clock.UtcNow;
            using var activity = PaperBinderTelemetry.StartActivity(PaperBinderTelemetry.ActivityNames.WorkerCleanupCycle);
            activity?.SetTag(PaperBinderTelemetry.ActivityTags.Surface, "worker");
            using var scope = logger.BeginScope(new Dictionary<string, object?>
            {
                ["trace_id"] = activity?.TraceId.ToString()
            });

            logger.LogInformation(
                "Lease cleanup cycle started. event_name={event_name} started_at_utc={started_at_utc}",
                "tenant_cleanup_cycle_started",
                cycleStartedAtUtc);

            try
            {
                using var cleanupScope = serviceScopeFactory.CreateScope();
                var cleanupService = cleanupScope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>();
                var result = await cleanupService.RunCleanupCycleAsync(stoppingToken);
                activity?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupSelectedTenantCount, result.SelectedTenantCount);
                activity?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupPurgedTenantCount, result.PurgedTenantCount);
                activity?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupSkippedTenantCount, result.SkippedTenantCount);
                activity?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupFailedTenantCount, result.FailedTenantCount);
                activity?.SetStatus(ActivityStatusCode.Ok);

                logger.LogInformation(
                    "Lease cleanup cycle completed. event_name={event_name} started_at_utc={started_at_utc} selected_tenant_count={selected_tenant_count} purged_tenant_count={purged_tenant_count} skipped_tenant_count={skipped_tenant_count} failed_tenant_count={failed_tenant_count}",
                    "tenant_cleanup_cycle_completed",
                    cycleStartedAtUtc,
                    result.SelectedTenantCount,
                    result.PurgedTenantCount,
                    result.SkippedTenantCount,
                    result.FailedTenantCount);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
                logger.LogError(
                    ex,
                    "Lease cleanup cycle failed. event_name={event_name} started_at_utc={started_at_utc}",
                    "tenant_cleanup_cycle_failed",
                    cycleStartedAtUtc);
            }

            try
            {
                await Task.Delay(cleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        logger.LogInformation(
            "PaperBinder.Worker service stopping. event_name={event_name}",
            "worker_stopping");
    }
}
