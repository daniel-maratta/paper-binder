using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Npgsql;
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
                """
                select
                    u.id as UserId,
                    u.email as Email,
                    ut.role as Role,
                    ut.is_owner as IsOwner
                from user_tenants ut
                inner join users u on u.id = ut.user_id
                where ut.tenant_id = @TenantId
                order by u.normalized_email;
                """,
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
                "Tenant user creation rejected an invalid role. TenantId={TenantId} ActorUserId={ActorUserId} RequestedRole={RequestedRole}",
                command.TenantId,
                command.ActorUserId,
                command.Role);

            return TenantUserCreateOutcome.Failed(
                new TenantUserAdministrationFailure(
                    TenantUserAdministrationFailureKind.InvalidRole,
                    "The supplied role is not a valid tenant role."));
        }

        var normalizedEmailInput = command.Email.Trim();
        var user = CreateUser(normalizedEmailInput);
        var passwordValidationMessages = await ValidatePasswordAsync(user, command.Password);
        if (passwordValidationMessages.Count > 0)
        {
            logger.LogWarning(
                "Tenant user creation rejected an invalid password. TenantId={TenantId} ActorUserId={ActorUserId} Email={Email} ValidationMessageCount={ValidationMessageCount}",
                command.TenantId,
                command.ActorUserId,
                normalizedEmailInput,
                passwordValidationMessages.Count);

            return TenantUserCreateOutcome.Failed(
                new TenantUserAdministrationFailure(
                    TenantUserAdministrationFailureKind.InvalidPassword,
                    BuildValidationDetail(passwordValidationMessages),
                    passwordValidationMessages));
        }

        user.PasswordHash = passwordHasher.HashPassword(user, command.Password);

        try
        {
            var createdUser = await transactionScopeRunner.ExecuteAsync(
                async (connection, transaction, innerCancellationToken) =>
                {
                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            insert into users (
                                id,
                                user_name,
                                normalized_user_name,
                                email,
                                normalized_email,
                                email_confirmed,
                                password_hash,
                                security_stamp)
                            values (
                                @Id,
                                @UserName,
                                @NormalizedUserName,
                                @Email,
                                @NormalizedEmail,
                                @EmailConfirmed,
                                @PasswordHash,
                                @SecurityStamp);
                            """,
                            user,
                            transaction,
                            cancellationToken: innerCancellationToken));

                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            insert into user_tenants (
                                user_id,
                                tenant_id,
                                role,
                                is_owner)
                            values (
                                @UserId,
                                @TenantId,
                                @Role,
                                @IsOwner);
                            """,
                            new
                            {
                                UserId = user.Id,
                                TenantId = command.TenantId,
                                Role = role.ToString(),
                                IsOwner = false
                            },
                            transaction,
                            cancellationToken: innerCancellationToken));

                    return new TenantUserSummary(user.Id, user.Email, role, IsOwner: false);
                },
                cancellationToken: cancellationToken);

            logger.LogInformation(
                "Tenant user created. TenantId={TenantId} ActorUserId={ActorUserId} TargetUserId={TargetUserId} Role={Role}",
                command.TenantId,
                command.ActorUserId,
                createdUser.UserId,
                createdUser.Role);

            return TenantUserCreateOutcome.Success(createdUser);
        }
        catch (PostgresException ex) when (IsEmailConflict(ex))
        {
            logger.LogWarning(
                ex,
                "Tenant user creation detected an email conflict. TenantId={TenantId} ActorUserId={ActorUserId} Email={Email}",
                command.TenantId,
                command.ActorUserId,
                normalizedEmailInput);

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
                "Tenant user role change rejected an invalid role. TenantId={TenantId} ActorUserId={ActorUserId} TargetUserId={TargetUserId} RequestedRole={RequestedRole}",
                command.TenantId,
                command.ActorUserId,
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
                        """
                        select
                            u.id as UserId,
                            u.email as Email,
                            ut.role as Role,
                            ut.is_owner as IsOwner
                        from user_tenants ut
                        inner join users u on u.id = ut.user_id
                        where ut.tenant_id = @TenantId
                          and ut.user_id = @UserId
                        for update of ut;
                        """,
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
                            """
                            select user_id
                            from user_tenants
                            where tenant_id = @TenantId
                              and role = @Role
                            for update;
                            """,
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
                        """
                        update user_tenants
                        set role = @Role
                        where tenant_id = @TenantId
                          and user_id = @UserId;
                        """,
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
                "Tenant user role changed. TenantId={TenantId} ActorUserId={ActorUserId} TargetUserId={TargetUserId} Role={Role}",
                command.TenantId,
                command.ActorUserId,
                command.TargetUserId,
                outcome.User!.Role);
        }
        else
        {
            logger.LogWarning(
                "Tenant user role change rejected. TenantId={TenantId} ActorUserId={ActorUserId} TargetUserId={TargetUserId} FailureKind={FailureKind}",
                command.TenantId,
                command.ActorUserId,
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

    private sealed class TenantUserRecord
    {
        public Guid UserId { get; init; }

        public string Email { get; init; } = string.Empty;

        public string Role { get; init; } = string.Empty;

        public bool IsOwner { get; init; }

        public TenantUserSummary ToSummary() =>
            new(UserId, Email, TenantRoleParser.Parse(Role), IsOwner);
    }
}
