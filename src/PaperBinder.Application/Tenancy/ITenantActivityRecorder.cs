namespace PaperBinder.Application.Tenancy;

public interface ITenantActivityRecorder
{
    Task RecordAuthenticatedActivityAsync(
        Guid tenantId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
