using Dapper;
using Npgsql;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantImpersonationAuditService(ISqlConnectionFactory connectionFactory)
    : ITenantImpersonationAuditService
{
    public async Task<bool> TryAppendAsync(
        TenantImpersonationAuditEvent auditEvent,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(
                    """
                    insert into tenant_impersonation_audit_events (
                        id,
                        session_id,
                        event_name,
                        tenant_id,
                        actor_user_id,
                        effective_user_id,
                        occurred_at_utc,
                        correlation_id)
                    values (
                        @Id,
                        @SessionId,
                        @EventName,
                        @TenantId,
                        @ActorUserId,
                        @EffectiveUserId,
                        @OccurredAtUtc,
                        @CorrelationId);
                    """,
                    new
                    {
                        Id = Guid.NewGuid(),
                        auditEvent.SessionId,
                        auditEvent.EventName,
                        auditEvent.TenantId,
                        auditEvent.ActorUserId,
                        auditEvent.EffectiveUserId,
                        auditEvent.OccurredAtUtc,
                        auditEvent.CorrelationId
                    },
                    cancellationToken: cancellationToken));

            return true;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation &&
                                           ex.ConstraintName == "ux_tenant_impersonation_audit_events_session_id_event_name")
        {
            return false;
        }
    }
}
