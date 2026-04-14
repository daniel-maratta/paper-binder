using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Configuration;

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
            logger.LogInformation(
                "Lease cleanup cycle started. event_name={event_name} started_at_utc={started_at_utc}",
                "tenant_cleanup_cycle_started",
                cycleStartedAtUtc);

            try
            {
                using var scope = serviceScopeFactory.CreateScope();
                var cleanupService = scope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>();
                var result = await cleanupService.RunCleanupCycleAsync(stoppingToken);

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
