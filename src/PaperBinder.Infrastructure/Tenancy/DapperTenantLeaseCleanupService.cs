using Dapper;
using System.Diagnostics;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantLeaseCleanupService(
    ISqlConnectionFactory connectionFactory,
    ITransactionScopeRunner transactionScopeRunner,
    ISystemClock clock,
    PaperBinderRuntimeSettings runtimeSettings,
    ILogger<DapperTenantLeaseCleanupService> logger) : ITenantLeaseCleanupService
{
    public async Task<TenantLeaseCleanupCycleResult> RunCleanupCycleAsync(
        CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;
        try
        {
            await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
            var candidates = (await connection.QueryAsync<TenantCleanupCandidate>(
                new CommandDefinition(
                    """
                    select
                        id as TenantId
                    from tenants
                    where expires_at_utc <= @Now
                    order by expires_at_utc, id;
                    """,
                    new { Now = now },
                    cancellationToken: cancellationToken)))
                .ToArray();

            var purgedTenantCount = 0;
            var skippedTenantCount = 0;
            var failedTenantCount = 0;

            foreach (var candidate in candidates)
            {
                try
                {
                    var outcome = await PurgeTenantIfExpiredAsync(candidate.TenantId, now, cancellationToken);
                    switch (outcome.Kind)
                    {
                        case TenantCleanupOutcomeKind.Purged:
                            purgedTenantCount++;
                            LogSuccessfulPurge(outcome.Summary!);
                            break;

                        case TenantCleanupOutcomeKind.Skipped:
                            skippedTenantCount++;
                            break;

                        default:
                            throw new ArgumentOutOfRangeException(nameof(outcome.Kind), outcome.Kind, "Unknown cleanup outcome.");
                    }
                }
                catch (Exception ex)
                {
                    failedTenantCount++;
                    logger.LogError(
                        ex,
                        "Expired tenant cleanup failed. event_name={event_name} tenant_id={tenant_id}",
                        "tenant_purge_failed",
                        candidate.TenantId);
                }
            }

            PaperBinderTelemetry.RecordCleanupCycle(PaperBinderTelemetry.CleanupResults.Completed);
            PaperBinderTelemetry.RecordCleanupTenants(PaperBinderTelemetry.CleanupResults.Purged, purgedTenantCount);
            PaperBinderTelemetry.RecordCleanupTenants(PaperBinderTelemetry.CleanupResults.Skipped, skippedTenantCount);
            PaperBinderTelemetry.RecordCleanupTenants(PaperBinderTelemetry.CleanupResults.Failed, failedTenantCount);

            Activity.Current?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupSelectedTenantCount, candidates.Length);
            Activity.Current?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupPurgedTenantCount, purgedTenantCount);
            Activity.Current?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupSkippedTenantCount, skippedTenantCount);
            Activity.Current?.SetTag(PaperBinderTelemetry.ActivityTags.CleanupFailedTenantCount, failedTenantCount);

            return new TenantLeaseCleanupCycleResult(
                candidates.Length,
                purgedTenantCount,
                skippedTenantCount,
                failedTenantCount);
        }
        catch
        {
            PaperBinderTelemetry.RecordCleanupCycle(PaperBinderTelemetry.CleanupResults.Failed);
            throw;
        }
    }

    private async Task<TenantCleanupOutcome> PurgeTenantIfExpiredAsync(
        Guid tenantId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        return await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var isExpired = await connection.QuerySingleOrDefaultAsync<Guid?>(
                    new CommandDefinition(
                        """
                        select id
                        from tenants
                        where id = @TenantId
                          and expires_at_utc <= @Now
                        for update;
                        """,
                        new
                        {
                            TenantId = tenantId,
                            Now = now
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (isExpired is null)
                {
                    return TenantCleanupOutcome.Skipped();
                }

                var userIds = (await connection.QueryAsync<Guid>(
                    new CommandDefinition(
                        """
                        select user_id
                        from user_tenants
                        where tenant_id = @TenantId
                        order by user_id;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken)))
                    .ToArray();

                var deletedImpersonationAuditEvents = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from tenant_impersonation_audit_events
                        where tenant_id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                var deletedDocuments = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from documents
                        where tenant_id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                var deletedBinderPolicies = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from binder_policies
                        where tenant_id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                var deletedBinders = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from binders
                        where tenant_id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                var deletedMemberships = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from user_tenants
                        where tenant_id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                var deletedUsers = userIds.Length == 0
                    ? 0
                    : await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            delete from users
                            where id = any(@UserIds);
                            """,
                            new { UserIds = userIds },
                            transaction,
                            cancellationToken: innerCancellationToken));

                var deletedTenants = await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        delete from tenants
                        where id = @TenantId;
                        """,
                        new { TenantId = tenantId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return TenantCleanupOutcome.Purged(
                    new TenantPurgeSummary(
                        tenantId,
                        deletedTenants,
                        deletedImpersonationAuditEvents,
                        deletedMemberships,
                        deletedUsers,
                        deletedBinders,
                        deletedBinderPolicies,
                        deletedDocuments));
            },
            cancellationToken: cancellationToken);
    }

    private void LogSuccessfulPurge(TenantPurgeSummary summary)
    {
        if (runtimeSettings.Audit.RetentionMode != AuditRetentionMode.RetainTenantPurgedSummary)
        {
            return;
        }

        logger.LogInformation(
            "Expired tenant purged. event_name={event_name} tenant_id={tenant_id} deleted_tenant_rows={deleted_tenant_rows} deleted_impersonation_audit_events={deleted_impersonation_audit_events} deleted_memberships={deleted_memberships} deleted_users={deleted_users} deleted_binders={deleted_binders} deleted_binder_policies={deleted_binder_policies} deleted_documents={deleted_documents}",
            "tenant_purged",
            summary.TenantId,
            summary.DeletedTenantRows,
            summary.DeletedImpersonationAuditEvents,
            summary.DeletedMemberships,
            summary.DeletedUsers,
            summary.DeletedBinders,
            summary.DeletedBinderPolicies,
            summary.DeletedDocuments);
    }

    private sealed record TenantCleanupCandidate(Guid TenantId);

    private sealed record TenantPurgeSummary(
        Guid TenantId,
        int DeletedTenantRows,
        int DeletedImpersonationAuditEvents,
        int DeletedMemberships,
        int DeletedUsers,
        int DeletedBinders,
        int DeletedBinderPolicies,
        int DeletedDocuments);

    private sealed record TenantCleanupOutcome(
        TenantCleanupOutcomeKind Kind,
        TenantPurgeSummary? Summary)
    {
        public static TenantCleanupOutcome Purged(TenantPurgeSummary summary) => new(TenantCleanupOutcomeKind.Purged, summary);

        public static TenantCleanupOutcome Skipped() => new(TenantCleanupOutcomeKind.Skipped, null);
    }

    private enum TenantCleanupOutcomeKind
    {
        Purged,
        Skipped
    }
}
