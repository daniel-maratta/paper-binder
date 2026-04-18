namespace PaperBinder.Application.Tenancy;

public interface ITenantImpersonationAuditService
{
    Task<bool> TryAppendAsync(
        TenantImpersonationAuditEvent auditEvent,
        CancellationToken cancellationToken = default);
}

public sealed record TenantImpersonationAuditEvent(
    Guid SessionId,
    string EventName,
    Guid TenantId,
    Guid ActorUserId,
    Guid EffectiveUserId,
    DateTimeOffset OccurredAtUtc,
    string CorrelationId);

public static class TenantImpersonationAuditEventNames
{
    public const string Started = "ImpersonationStarted";
    public const string Ended = "ImpersonationEnded";
}
