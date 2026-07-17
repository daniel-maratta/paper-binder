using Dapper;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantActivityRecorder(ISqlConnectionFactory connectionFactory) : ITenantActivityRecorder
{
    public async Task RecordAuthenticatedActivityAsync(
        Guid tenantId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                """
                update tenants
                set last_authenticated_activity_at_utc = @OccurredAtUtc
                where id = @TenantId
                  and (last_authenticated_activity_at_utc is null or last_authenticated_activity_at_utc < @OccurredAtUtc);
                """,
                new
                {
                    TenantId = tenantId,
                    OccurredAtUtc = occurredAtUtc
                },
                cancellationToken: cancellationToken));
    }
}
