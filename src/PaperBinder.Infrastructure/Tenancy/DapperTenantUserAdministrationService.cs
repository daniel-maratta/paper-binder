using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Npgsql;
using PaperBinder.Application.Identity;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.Infrastructure.Tenancy;

public sealed class DapperTenantUserAdministrationService(
    ISqlConnectionFactory connectionFactory,
    ITransactionScopeRunner transactionScopeRunner,
    UserManager<PaperBinderUser> userManager,
    ILookupNormalizer lookupNormalizer,
    IPasswordHasher<PaperBinderUser> passwordHasher,
    ILogger<DapperTenantUserAdministrationService> logger) : ITenantUserAdministrationService
{
    public async Task<IReadOnlyList<TenantUserSummary>> ListUsersAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var records = await connection.QueryAsync<TenantUserRecord>(
            new CommandDefinition(
                TenantUserAdministrationSql.ListUsers,
                new { TenantId = tenantId },
                cancellationToken: cancellationToken));

        return records.Select(record => record.ToSummary()).ToArray();
    }

    public async Task<TenantUserCreateOutcome> CreateUserAsync(
        TenantUserCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        if (!TenantRoleParser.TryParse(command.Role, out var role))
        {
            logger.LogWarning(
                "Tenant user creation rejected an invalid role. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} RequestedRole={RequestedRole}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.Role);

            return TenantUserCreateOutcome.Failed(
                new TenantUserAdministrationFailure(
                    TenantUserAdministrationFailureKind.InvalidRole,
                    "The supplied role is not a valid tenant role."));
        }

        var normalizedEmailInput = command.Email.Trim();
        var user = CreateUser(normalizedEmailInput);
        var generatedPassword = OneTimeCredentialRules.GenerateOneTimePassword();
        var passwordValidationMessages = await ValidatePasswordAsync(user, generatedPassword);
        if (passwordValidationMessages.Count > 0)
        {
            logger.LogError(
                "Tenant user creation generated a password that failed the configured password rules. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} ValidationMessageCount={ValidationMessageCount}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                passwordValidationMessages.Count);

            throw new InvalidOperationException(
                $"Generated tenant-user password did not satisfy the configured password rules. {BuildValidationDetail(passwordValidationMessages)}");
        }

        user.PasswordHash = passwordHasher.HashPassword(user, generatedPassword);

        try
        {
            var createdUser = await transactionScopeRunner.ExecuteAsync(
                async (connection, transaction, innerCancellationToken) =>
                {
                    var tenantUserIds = await connection.QueryAsync<Guid>(
                        new CommandDefinition(
                            TenantUserAdministrationSql.SelectTenantUserIdsForUpdate,
                            new { TenantId = command.TenantId },
                            transaction,
                            cancellationToken: innerCancellationToken));

                    if (tenantUserIds.Count() >= TenantUserAdministrationRules.MaxUsersPerTenant)
                    {
                        return TenantUserCreateOutcome.Failed(
                            new TenantUserAdministrationFailure(
                                TenantUserAdministrationFailureKind.LimitReached,
                                $"This demo workspace can contain up to {TenantUserAdministrationRules.MaxUsersPerTenant} users."));
                    }

                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            TenantUserAdministrationSql.InsertUser,
                            user,
                            transaction,
                            cancellationToken: innerCancellationToken));

                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            TenantUserAdministrationSql.InsertTenantMembership,
                            new
                            {
                                UserId = user.Id,
                                TenantId = command.TenantId,
                                Role = role.ToString(),
                                IsOwner = false
                            },
                            transaction,
                            cancellationToken: innerCancellationToken));

                    return TenantUserCreateOutcome.Success(
                        new TenantUserSummary(user.Id, user.Email, role, IsOwner: false),
                        generatedPassword);
                },
                cancellationToken: cancellationToken);

            if (!createdUser.Succeeded)
            {
                logger.LogWarning(
                    "Tenant user creation rejected. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} FailureKind={FailureKind}",
                    command.TenantId,
                    command.ActorUserId,
                    command.EffectiveUserId,
                    command.IsImpersonated,
                    createdUser.Failure!.Kind);

                return createdUser;
            }

            logger.LogInformation(
                "Tenant user created. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId} Role={Role}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                createdUser.User!.UserId,
                createdUser.User.Role);

            return createdUser;
        }
        catch (PostgresException ex) when (IsEmailConflict(ex))
        {
            logger.LogWarning(
                "Tenant user creation detected an email conflict. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated);

            return TenantUserCreateOutcome.Failed(
                new TenantUserAdministrationFailure(
                    TenantUserAdministrationFailureKind.EmailConflict,
                    "A user with that email already exists."));
        }
    }

    public async Task<TenantUserRoleChangeOutcome> ChangeRoleAsync(
        TenantUserRoleChangeCommand command,
        CancellationToken cancellationToken = default)
    {
        if (!TenantRoleParser.TryParse(command.Role, out var requestedRole))
        {
            logger.LogWarning(
                "Tenant user role change rejected an invalid role. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId} RequestedRole={RequestedRole}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.TargetUserId,
                command.Role);

            return TenantUserRoleChangeOutcome.Failed(
                new TenantUserAdministrationFailure(
                    TenantUserAdministrationFailureKind.InvalidRole,
                    "The supplied role is not a valid tenant role."));
        }

        var outcome = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var targetUser = await connection.QuerySingleOrDefaultAsync<TenantUserRecord>(
                    new CommandDefinition(
                        TenantUserAdministrationSql.SelectTenantUserForUpdate,
                        new
                        {
                            TenantId = command.TenantId,
                            UserId = command.TargetUserId
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (targetUser is null)
                {
                    return TenantUserRoleChangeOutcome.Failed(
                        new TenantUserAdministrationFailure(
                            TenantUserAdministrationFailureKind.UserNotFound,
                            "The requested tenant user does not exist."));
                }

                var currentRole = targetUser.ToSummary().Role;
                if (currentRole == requestedRole)
                {
                    return TenantUserRoleChangeOutcome.Success(
                        new TenantUserSummary(targetUser.UserId, targetUser.Email, currentRole, targetUser.IsOwner));
                }

                if (currentRole == TenantRole.TenantAdmin &&
                    requestedRole != TenantRole.TenantAdmin)
                {
                    var tenantAdminIds = (await connection.QueryAsync<Guid>(
                        new CommandDefinition(
                            TenantUserAdministrationSql.SelectTenantAdminIdsForUpdate,
                            new
                            {
                                TenantId = command.TenantId,
                                Role = nameof(TenantRole.TenantAdmin)
                            },
                            transaction,
                            cancellationToken: innerCancellationToken)))
                        .ToArray();

                    if (TenantUserAdministrationRules.WouldDemoteLastAdmin(
                            currentRole,
                            requestedRole,
                            tenantAdminIds.Length))
                    {
                        return TenantUserRoleChangeOutcome.Failed(
                            new TenantUserAdministrationFailure(
                                TenantUserAdministrationFailureKind.LastTenantAdminRequired,
                                "At least one tenant admin must remain assigned to the tenant."));
                    }
                }

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        TenantUserAdministrationSql.UpdateTenantUserRole,
                        new
                        {
                            TenantId = command.TenantId,
                            UserId = command.TargetUserId,
                            Role = requestedRole.ToString()
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return TenantUserRoleChangeOutcome.Success(
                    new TenantUserSummary(targetUser.UserId, targetUser.Email, requestedRole, targetUser.IsOwner));
            },
            cancellationToken: cancellationToken);

        if (outcome.Succeeded)
        {
            logger.LogInformation(
                "Tenant user role changed. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId} Role={Role}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.TargetUserId,
                outcome.User!.Role);
        }
        else
        {
            logger.LogWarning(
                "Tenant user role change rejected. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId} FailureKind={FailureKind}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.TargetUserId,
                outcome.Failure!.Kind);
        }

        return outcome;
    }

    public async Task<TenantUserDeleteOutcome> DeleteUserAsync(
        TenantUserDeleteCommand command,
        CancellationToken cancellationToken = default)
    {
        var outcome = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var targetUser = await connection.QuerySingleOrDefaultAsync<TenantUserRecord>(
                    new CommandDefinition(
                        TenantUserAdministrationSql.SelectTenantUserForUpdate,
                        new
                        {
                            TenantId = command.TenantId,
                            UserId = command.TargetUserId
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (targetUser is null)
                {
                    return TenantUserDeleteOutcome.Failed(
                        new TenantUserAdministrationFailure(
                            TenantUserAdministrationFailureKind.UserNotFound,
                            "The requested tenant user does not exist."));
                }

                var currentRole = targetUser.ToSummary().Role;
                if (TenantUserAdministrationRules.WouldDeleteOwner(targetUser.IsOwner))
                {
                    return TenantUserDeleteOutcome.Failed(
                        new TenantUserAdministrationFailure(
                            TenantUserAdministrationFailureKind.LastTenantOwnerRequired,
                            "The workspace owner cannot be deleted."));
                }

                if (currentRole == TenantRole.TenantAdmin &&
                    TenantUserAdministrationRules.WouldDeleteLastAdmin(
                        currentRole,
                        await CountTenantAdminsForUpdateAsync(connection, transaction, command.TenantId, innerCancellationToken)))
                {
                    return TenantUserDeleteOutcome.Failed(
                        new TenantUserAdministrationFailure(
                            TenantUserAdministrationFailureKind.LastTenantAdminRequired,
                            "At least one tenant admin must remain assigned to the tenant."));
                }

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        TenantUserAdministrationSql.DeleteTenantUser,
                        new
                        {
                            TenantId = command.TenantId,
                            UserId = command.TargetUserId
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return TenantUserDeleteOutcome.Success();
            },
            cancellationToken: cancellationToken);

        if (outcome.Succeeded)
        {
            logger.LogInformation(
                "Tenant user deleted. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.TargetUserId);
        }
        else
        {
            logger.LogWarning(
                "Tenant user delete rejected. TenantId={TenantId} ActorUserId={ActorUserId} EffectiveUserId={EffectiveUserId} IsImpersonated={IsImpersonated} TargetUserId={TargetUserId} FailureKind={FailureKind}",
                command.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.TargetUserId,
                outcome.Failure!.Kind);
        }

        return outcome;
    }

    private PaperBinderUser CreateUser(string email)
    {
        var user = new PaperBinderUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            NormalizedUserName = NormalizeName(email),
            Email = email,
            NormalizedEmail = NormalizeEmail(email),
            EmailConfirmed = true,
            SecurityStamp = Guid.NewGuid().ToString("N")
        };

        return user;
    }

    private async Task<IReadOnlyList<string>> ValidatePasswordAsync(PaperBinderUser user, string password)
    {
        var messages = new List<string>();

        foreach (var validator in userManager.PasswordValidators)
        {
            var result = await validator.ValidateAsync(userManager, user, password);
            if (!result.Succeeded)
            {
                messages.AddRange(
                    result.Errors
                        .Select(error => error.Description)
                        .Where(description => !string.IsNullOrWhiteSpace(description)));
            }
        }

        return messages
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    private bool IsEmailConflict(PostgresException ex) =>
        ex.SqlState == PostgresErrorCodes.UniqueViolation &&
        ex.ConstraintName is "ux_users_normalized_email" or "ux_users_normalized_user_name";

    private string NormalizeName(string value) =>
        lookupNormalizer.NormalizeName(value) ?? value.ToUpperInvariant();

    private string NormalizeEmail(string value) =>
        lookupNormalizer.NormalizeEmail(value) ?? value.ToUpperInvariant();

    private static string BuildValidationDetail(IReadOnlyList<string> validationMessages) =>
        validationMessages.Count switch
        {
            0 => "The supplied password did not satisfy the configured password rules.",
            1 => validationMessages[0],
            _ => string.Join(" ", validationMessages)
        };

    private static async Task<int> CountTenantAdminsForUpdateAsync(
        System.Data.Common.DbConnection connection,
        System.Data.Common.DbTransaction transaction,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var tenantAdminIds = await connection.QueryAsync<Guid>(
            new CommandDefinition(
                TenantUserAdministrationSql.SelectTenantAdminIdsForUpdate,
                new
                {
                    TenantId = tenantId,
                    Role = nameof(TenantRole.TenantAdmin)
                },
                transaction,
                cancellationToken: cancellationToken));

        return tenantAdminIds.Count();
    }

}
