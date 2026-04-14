namespace PaperBinder.Application.Tenancy;

public interface ITenantLeaseCleanupService
{
    Task<TenantLeaseCleanupCycleResult> RunCleanupCycleAsync(
        CancellationToken cancellationToken = default);
}
