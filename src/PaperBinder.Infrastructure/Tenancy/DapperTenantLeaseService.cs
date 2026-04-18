using Dapper;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantLeaseService(
    ISqlConnectionFactory connectionFactory,
    ITransactionScopeRunner transactionScopeRunner,
    ISystemClock clock,
    PaperBinderRuntimeSettings runtimeSettings,
    ILogger<DapperTenantLeaseService> logger) : ITenantLeaseService
{
    public async Task<TenantLeaseReadOutcome> GetAsync(
        TenantContext tenant,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var snapshot = await connection.QuerySingleOrDefaultAsync<TenantLeaseSnapshotRecord>(
            new CommandDefinition(
                """
                select
                    id as TenantId,
                    slug as TenantSlug,
                    expires_at_utc as ExpiresAtUtc,
                    lease_extension_count as ExtensionCount
                from tenants
                where id = @TenantId;
                """,
                new { TenantId = tenant.TenantId },
                cancellationToken: cancellationToken));

        if (snapshot is null)
        {
            return TenantLeaseReadOutcome.Failed(
                new TenantLeaseFailure(
                    TenantLeaseFailureKind.NotFound,
                    "The requested tenant does not exist."));
        }

        return TenantLeaseReadOutcome.Success(
            TenantLeaseRules.ProjectState(snapshot.ToSnapshot(), CreatePolicy(), clock.UtcNow));
    }

    public async Task<TenantLeaseExtendOutcome> ExtendAsync(
        TenantLeaseExtendCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Tenant);

        var policy = CreatePolicy();
        var now = clock.UtcNow;

        var outcome = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var snapshot = await connection.QuerySingleOrDefaultAsync<TenantLeaseSnapshotRecord>(
                    new CommandDefinition(
                        """
                        select
                            id as TenantId,
                            slug as TenantSlug,
                            expires_at_utc as ExpiresAtUtc,
                            lease_extension_count as ExtensionCount
                        from tenants
                        where id = @TenantId
                        for update;
                        """,
                        new { TenantId = command.Tenant.TenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (snapshot is null)
                {
                    return TenantLeaseExtendOutcome.Failed(
                        new TenantLeaseFailure(
                            TenantLeaseFailureKind.NotFound,
                            "The requested tenant does not exist."));
                }

                if (snapshot.ExtensionCount >= policy.MaxExtensions)
                {
                    return TenantLeaseExtendOutcome.Failed(
                        new TenantLeaseFailure(
                            TenantLeaseFailureKind.ExtensionLimitReached,
                            "The tenant has already used the maximum number of lease extensions."));
                }

                if (!TenantLeaseRules.CanExtend(snapshot.ExpiresAtUtc, snapshot.ExtensionCount, policy, now))
                {
                    return TenantLeaseExtendOutcome.Failed(
                        new TenantLeaseFailure(
                            TenantLeaseFailureKind.ExtensionWindowNotOpen,
                            $"The tenant lease can be extended only when the remaining lease is greater than 0 and less than or equal to {policy.ExtensionMinutes} minutes."));
                }

                var updatedSnapshot = snapshot.WithExtension(policy.ExtensionMinutes);

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        update tenants
                        set expires_at_utc = @ExpiresAtUtc,
                            lease_extension_count = @ExtensionCount
                        where id = @TenantId;
                        """,
                        new
                        {
                            updatedSnapshot.TenantId,
                            updatedSnapshot.ExpiresAtUtc,
                            updatedSnapshot.ExtensionCount
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return TenantLeaseExtendOutcome.Success(
                    TenantLeaseRules.ProjectState(updatedSnapshot.ToSnapshot(), policy, now));
            },
            cancellationToken: cancellationToken);

        if (!outcome.Succeeded)
        {
            logger.LogWarning(
                "Tenant lease extension rejected. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} failure_kind={failure_kind}",
                "tenant_lease_extend_rejected",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                outcome.Failure!.Kind);

            return outcome;
        }

        logger.LogInformation(
            "Tenant lease extended. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} expires_at_utc={expires_at_utc} extension_count={extension_count}",
            "tenant_lease_extended",
            command.Tenant.TenantId,
            command.ActorUserId,
            command.EffectiveUserId,
            command.IsImpersonated,
            outcome.Lease!.ExpiresAtUtc,
            outcome.Lease.ExtensionCount);

        return outcome;
    }

    private TenantLeasePolicy CreatePolicy() =>
        new(
            runtimeSettings.Lease.ExtensionMinutes,
            runtimeSettings.Lease.MaxExtensions);

    private sealed class TenantLeaseSnapshotRecord
    {
        public Guid TenantId { get; init; }

        public string TenantSlug { get; init; } = string.Empty;

        public DateTimeOffset ExpiresAtUtc { get; init; }

        public int ExtensionCount { get; init; }

        public TenantLeaseSnapshot ToSnapshot() =>
            new(TenantId, TenantSlug, ExpiresAtUtc, ExtensionCount);

        public TenantLeaseSnapshotRecord WithExtension(int extensionMinutes) =>
            new()
            {
                TenantId = TenantId,
                TenantSlug = TenantSlug,
                ExpiresAtUtc = ExpiresAtUtc.AddMinutes(extensionMinutes),
                ExtensionCount = ExtensionCount + 1
            };
    }
}
