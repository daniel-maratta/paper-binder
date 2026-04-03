using Dapper;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantLookupService(ISqlConnectionFactory connectionFactory) : ITenantLookupService
{
    public async Task<TenantContext?> FindBySlugAsync(
        string tenantSlug,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantSlug);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<TenantContext>(
            new CommandDefinition(
                """
                select
                    id as TenantId,
                    slug as TenantSlug,
                    name as TenantName
                from tenants
                where slug = @TenantSlug;
                """,
                new { TenantSlug = tenantSlug },
                cancellationToken: cancellationToken));
    }
}
