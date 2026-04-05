using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Npgsql;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Provisioning;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.Infrastructure.Provisioning;

public sealed class DapperTenantProvisioningService(
    ITransactionScopeRunner transactionScopeRunner,
    IPasswordHasher<PaperBinderUser> passwordHasher,
    ILookupNormalizer lookupNormalizer,
    ISystemClock clock,
    PaperBinderRuntimeSettings runtimeSettings,
    ILogger<DapperTenantProvisioningService> logger) : ITenantProvisioningService
{
    public async Task<TenantProvisioningOutcome> ProvisionAsync(
        string tenantName,
        CancellationToken cancellationToken = default)
    {
        if (!TenantProvisioningRules.TryNormalizeTenantName(tenantName, out var normalized))
        {
            logger.LogWarning(
                "Tenant provisioning rejected an invalid tenant name. TenantNameLength={TenantNameLength}",
                tenantName?.Length ?? 0);

            return TenantProvisioningOutcome.InvalidTenantName(
                "The supplied tenant name must contain letters or digits and fit within the provisioning limits.");
        }

        var tenantId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var generatedPassword = TenantProvisioningRules.GenerateOneTimePassword();
        var ownerEmail = $"owner@{normalized!.TenantSlug}.local";
        var createdAtUtc = clock.UtcNow;
        var expiresAtUtc = createdAtUtc.AddMinutes(runtimeSettings.Lease.DefaultMinutes);

        var ownerUser = CreateOwnerUser(ownerUserId, ownerEmail, generatedPassword);

        try
        {
            await transactionScopeRunner.ExecuteAsync(
                async (connection, transaction, innerCancellationToken) =>
                {
                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            insert into tenants (
                                id,
                                slug,
                                name,
                                created_at_utc,
                                expires_at_utc,
                                lease_extension_count)
                            values (
                                @Id,
                                @Slug,
                                @Name,
                                @CreatedAtUtc,
                                @ExpiresAtUtc,
                                0);
                            """,
                            new
                            {
                                Id = tenantId,
                                Slug = normalized.TenantSlug,
                                Name = normalized.TenantName,
                                CreatedAtUtc = createdAtUtc,
                                ExpiresAtUtc = expiresAtUtc
                            },
                            transaction,
                            cancellationToken: innerCancellationToken));

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
                            ownerUser,
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
                                UserId = ownerUserId,
                                TenantId = tenantId,
                                Role = nameof(TenantRole.TenantAdmin),
                                IsOwner = true
                            },
                            transaction,
                            cancellationToken: innerCancellationToken));
                },
                cancellationToken: cancellationToken);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            logger.LogWarning(
                ex,
                "Tenant provisioning detected a name conflict. TenantSlug={TenantSlug}",
                normalized.TenantSlug);

            return TenantProvisioningOutcome.TenantNameConflict(
                "That tenant name is unavailable. Choose a different tenant name and try again.");
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Tenant provisioning failed unexpectedly. TenantSlug={TenantSlug}",
                normalized.TenantSlug);
            throw;
        }

        return TenantProvisioningOutcome.Success(
            new ProvisionedTenant(
                tenantId,
                ownerUserId,
                normalized.TenantName,
                normalized.TenantSlug,
                expiresAtUtc,
                ownerEmail,
                generatedPassword));
    }

    private PaperBinderUser CreateOwnerUser(
        Guid userId,
        string ownerEmail,
        string generatedPassword)
    {
        var user = new PaperBinderUser
        {
            Id = userId,
            UserName = ownerEmail,
            NormalizedUserName = NormalizeName(ownerEmail),
            Email = ownerEmail,
            NormalizedEmail = NormalizeEmail(ownerEmail),
            EmailConfirmed = true,
            SecurityStamp = Guid.NewGuid().ToString("N")
        };

        user.PasswordHash = passwordHasher.HashPassword(user, generatedPassword);
        return user;
    }

    private string NormalizeName(string value) =>
        lookupNormalizer.NormalizeName(value) ?? value.ToUpperInvariant();

    private string NormalizeEmail(string value) =>
        lookupNormalizer.NormalizeEmail(value) ?? value.ToUpperInvariant();
}
