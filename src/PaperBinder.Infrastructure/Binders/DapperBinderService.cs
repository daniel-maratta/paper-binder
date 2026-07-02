using Dapper;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;

namespace PaperBinder.Infrastructure.Binders;

public sealed class DapperBinderService(
    ISqlConnectionFactory connectionFactory,
    ITransactionScopeRunner transactionScopeRunner,
    ISystemClock clock,
    IBinderPolicyEvaluator policyEvaluator,
    ILogger<DapperBinderService> logger) : IBinderService
{
    public async Task<IReadOnlyList<BinderSummary>> ListAsync(
        TenantContext tenant,
        TenantRole callerRole,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var records = await connection.QueryAsync<BinderSummaryRecord>(
            new CommandDefinition(
                BinderSql.ListVisibleBinders,
                new
                {
                    TenantId = tenant.TenantId,
                    InheritMode = BinderPolicyModeNames.Inherit,
                    RestrictedRolesMode = BinderPolicyModeNames.RestrictedRoles,
                    AllowedRoles = new[] { callerRole.ToString() }
                },
                cancellationToken: cancellationToken));

        return records
            .Select(record => record.ToSummary())
            .ToArray();
    }

    public async Task<BinderCreateOutcome> CreateAsync(
        BinderCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Tenant);

        if (!BinderNameRules.TryTrimToValidName(command.Name, out var normalizedName))
        {
            return BinderCreateOutcome.Failed(
                new BinderFailure(
                    BinderFailureKind.NameInvalid,
                    "The request must include a binder name between 1 and 200 characters."));
        }

        var binderId = Guid.NewGuid();
        var createdAtUtc = clock.UtcNow;

        await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        BinderSql.InsertBinder,
                        new
                        {
                            BinderId = binderId,
                            TenantId = command.Tenant.TenantId,
                            Name = normalizedName,
                            CreatedAtUtc = createdAtUtc
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        BinderSql.InsertDefaultPolicy,
                        new
                        {
                            TenantId = command.Tenant.TenantId,
                            BinderId = binderId,
                            Mode = BinderPolicyModeNames.Inherit,
                            AllowedRoles = Array.Empty<string>(),
                            CreatedAtUtc = createdAtUtc,
                            UpdatedAtUtc = createdAtUtc
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));
            },
            cancellationToken: cancellationToken);

        logger.LogInformation(
            "Binder created. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id}",
            "binder_created",
            command.Tenant.TenantId,
            command.ActorUserId,
            command.EffectiveUserId,
            command.IsImpersonated,
            binderId);

        return BinderCreateOutcome.Success(new BinderSummary(binderId, normalizedName, createdAtUtc));
    }

    public async Task<BinderDetailOutcome> GetDetailAsync(
        TenantContext tenant,
        TenantRole callerRole,
        Guid binderId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var record = await connection.QuerySingleOrDefaultAsync<BinderDetailRecord>(
            new CommandDefinition(
                BinderSql.SelectBinderDetail,
                new
                {
                    TenantId = tenant.TenantId,
                    BinderId = binderId
                },
                cancellationToken: cancellationToken));

        if (record is null)
        {
            return BinderDetailOutcome.Failed(
                new BinderFailure(
                    BinderFailureKind.NotFound,
                    "The requested binder does not exist in the current tenant."));
        }

        var policy = record.ToPolicy();
        if (!policyEvaluator.CanAccess(callerRole, policy))
        {
            return BinderDetailOutcome.Failed(
                new BinderFailure(
                    BinderFailureKind.PolicyDenied,
                    "The current tenant role is not allowed to access this binder."));
        }

        return BinderDetailOutcome.Success(
            record.ToDetail());
    }

    public async Task<BinderPolicyReadOutcome> GetPolicyAsync(
        TenantContext tenant,
        Guid binderId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var record = await connection.QuerySingleOrDefaultAsync<BinderPolicyRecord>(
            new CommandDefinition(
                BinderSql.SelectBinderPolicy,
                new
                {
                    TenantId = tenant.TenantId,
                    BinderId = binderId
                },
                cancellationToken: cancellationToken));

        return record is null
            ? BinderPolicyReadOutcome.Failed(
                new BinderFailure(
                    BinderFailureKind.NotFound,
                    "The requested binder does not exist in the current tenant."))
            : BinderPolicyReadOutcome.Success(record.ToPolicy());
    }

    public async Task<BinderPolicyUpdateOutcome> UpdatePolicyAsync(
        BinderPolicyUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Tenant);

        var validation = BinderPolicyRules.ValidateAndNormalize(command.Mode, command.AllowedRoles);
        if (!validation.Succeeded)
        {
            logger.LogWarning(
                "Binder policy update rejected. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id} reason={reason}",
                "binder_policy_update_rejected",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.BinderId,
                validation.Detail);

            return BinderPolicyUpdateOutcome.Failed(
                new BinderFailure(
                    BinderFailureKind.PolicyInvalid,
                    validation.Detail!));
        }

        var requestedPolicy = validation.Policy!;
        var requestedAllowedRoles = requestedPolicy.AllowedRoles
            .Select(role => role.ToString())
            .ToArray();

        var executionResult = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var currentRecord = await connection.QuerySingleOrDefaultAsync<BinderPolicyRecord>(
                    new CommandDefinition(
                        BinderSql.SelectBinderPolicyForUpdate,
                        new
                        {
                            TenantId = command.Tenant.TenantId,
                            BinderId = command.BinderId
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (currentRecord is null)
                {
                    return new BinderPolicyUpdateExecutionResult(
                        BinderPolicyUpdateOutcome.Failed(
                            new BinderFailure(
                                BinderFailureKind.NotFound,
                                "The requested binder does not exist in the current tenant.")),
                        WasUpdated: false);
                }

                var currentPolicy = currentRecord.ToPolicy();
                if (PoliciesEqual(currentPolicy, requestedPolicy))
                {
                    return new BinderPolicyUpdateExecutionResult(
                        BinderPolicyUpdateOutcome.Success(currentPolicy),
                        WasUpdated: false);
                }

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        BinderSql.UpdateBinderPolicy,
                        new
                        {
                            TenantId = command.Tenant.TenantId,
                            BinderId = command.BinderId,
                            Mode = BinderPolicyModeNames.ToContractValue(requestedPolicy.Mode),
                            AllowedRoles = requestedAllowedRoles,
                            UpdatedAtUtc = clock.UtcNow
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return new BinderPolicyUpdateExecutionResult(
                    BinderPolicyUpdateOutcome.Success(requestedPolicy),
                    WasUpdated: true);
            },
            cancellationToken: cancellationToken);

        var outcome = executionResult.Outcome;
        if (!outcome.Succeeded)
        {
            logger.LogWarning(
                "Binder policy update failed. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id} failure_kind={failure_kind}",
                "binder_policy_update_failed",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.BinderId,
                outcome.Failure!.Kind);

            return outcome;
        }

        logger.LogInformation(
            "Binder policy updated. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id} mode={mode} allowed_roles={allowed_roles}",
            executionResult.WasUpdated ? "binder_policy_updated" : "binder_policy_update_noop",
            command.Tenant.TenantId,
            command.ActorUserId,
            command.EffectiveUserId,
            command.IsImpersonated,
            command.BinderId,
            BinderPolicyModeNames.ToContractValue(outcome.Policy!.Mode),
            outcome.Policy.AllowedRoles.Select(role => role.ToString()).ToArray());

        return outcome;
    }

    private static bool PoliciesEqual(BinderPolicy left, BinderPolicy right) =>
        left.Mode == right.Mode &&
        left.AllowedRoles.SequenceEqual(right.AllowedRoles);

    private sealed record BinderPolicyUpdateExecutionResult(
        BinderPolicyUpdateOutcome Outcome,
        bool WasUpdated);
}
