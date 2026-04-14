namespace PaperBinder.Application.Tenancy;

public interface ITenantLeaseService
{
    Task<TenantLeaseReadOutcome> GetAsync(
        TenantContext tenant,
        CancellationToken cancellationToken = default);

    Task<TenantLeaseExtendOutcome> ExtendAsync(
        TenantLeaseExtendCommand command,
        CancellationToken cancellationToken = default);
}
