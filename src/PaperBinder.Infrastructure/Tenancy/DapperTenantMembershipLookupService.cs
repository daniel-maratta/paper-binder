using Dapper;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantMembershipLookupService(ISqlConnectionFactory connectionFactory)
    : ITenantMembershipLookupService
{
    public async Task<TenantMembership?> FindMembershipAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var record = await connection.QuerySingleOrDefaultAsync<TenantMembershipRecord>(
            new CommandDefinition(
                """
                select
                    user_id as UserId,
                    tenant_id as TenantId,
                    role as Role,
                    is_owner as IsOwner
                from user_tenants
                where user_id = @UserId
                  and tenant_id = @TenantId;
                """,
                new
                {
                    UserId = userId,
                    TenantId = tenantId
                },
                cancellationToken: cancellationToken));

        return record?.ToTenantMembership();
    }

    public async Task<ResolvedTenantMembership?> FindSingleMembershipAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var record = await connection.QuerySingleOrDefaultAsync<ResolvedTenantMembershipRecord>(
            new CommandDefinition(
                """
                select
                    ut.user_id as UserId,
                    ut.tenant_id as TenantId,
                    ut.role as Role,
                    ut.is_owner as IsOwner,
                    t.slug as TenantSlug,
                    t.name as TenantName,
                    t.expires_at_utc as ExpiresAtUtc
                from user_tenants ut
                inner join tenants t on t.id = ut.tenant_id
                where ut.user_id = @UserId;
                """,
                new { UserId = userId },
                cancellationToken: cancellationToken));

        return record?.ToResolvedTenantMembership();
    }

    private sealed class TenantMembershipRecord
    {
        public Guid UserId { get; init; }

        public Guid TenantId { get; init; }

        public string Role { get; init; } = string.Empty;

        public bool IsOwner { get; init; }

        public TenantMembership ToTenantMembership() =>
            new(
                UserId,
                TenantId,
                TenantRoleParser.Parse(Role),
                IsOwner);
    }

    private sealed class ResolvedTenantMembershipRecord
    {
        public Guid UserId { get; init; }

        public Guid TenantId { get; init; }

        public string Role { get; init; } = string.Empty;

        public bool IsOwner { get; init; }

        public string TenantSlug { get; init; } = string.Empty;

        public string TenantName { get; init; } = string.Empty;

        public DateTimeOffset ExpiresAtUtc { get; init; }

        public ResolvedTenantMembership ToResolvedTenantMembership()
        {
            var tenantContext = new TenantContext(TenantId, TenantSlug, TenantName);
            var resolvedTenantHost = new ResolvedTenantHost(tenantContext, ExpiresAtUtc);

            return new ResolvedTenantMembership(
                new TenantMembership(UserId, TenantId, TenantRoleParser.Parse(Role), IsOwner),
                resolvedTenantHost);
        }
    }
}
