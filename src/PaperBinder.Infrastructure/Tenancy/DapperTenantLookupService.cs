using Dapper;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantLookupService(ISqlConnectionFactory connectionFactory) : ITenantLookupService
{
    public async Task<ResolvedTenantHost?> FindBySlugAsync(
        string tenantSlug,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantSlug);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var record = await connection.QuerySingleOrDefaultAsync<ResolvedTenantHostRecord>(
            new CommandDefinition(
                """
                select
                    id as TenantId,
                    slug as TenantSlug,
                    name as TenantName,
                    expires_at_utc as ExpiresAtUtc
                from tenants
                where slug = @TenantSlug;
                """,
                new { TenantSlug = tenantSlug },
                cancellationToken: cancellationToken));

        return record?.ToResolvedTenantHost();
    }

    private sealed class ResolvedTenantHostRecord
    {
        public Guid TenantId { get; init; }

        public string TenantSlug { get; init; } = string.Empty;

        public string TenantName { get; init; } = string.Empty;

        public DateTimeOffset ExpiresAtUtc { get; init; }

        public ResolvedTenantHost ToResolvedTenantHost() =>
            new(
                new TenantContext(TenantId, TenantSlug, TenantName),
                ExpiresAtUtc);
    }
}
