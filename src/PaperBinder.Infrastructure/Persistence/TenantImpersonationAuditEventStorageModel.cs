namespace PaperBinder.Infrastructure.Persistence;

internal sealed class TenantImpersonationAuditEventStorageModel
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public string EventName { get; set; } = string.Empty;

    public Guid TenantId { get; set; }

    public Guid ActorUserId { get; set; }

    public Guid EffectiveUserId { get; set; }

    public DateTimeOffset OccurredAtUtc { get; set; }

    public string CorrelationId { get; set; } = string.Empty;
}
