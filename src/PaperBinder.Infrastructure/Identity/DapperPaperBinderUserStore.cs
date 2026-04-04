using Dapper;
using Microsoft.AspNetCore.Identity;
using PaperBinder.Application.Persistence;

namespace PaperBinder.Infrastructure.Identity;

public sealed class DapperPaperBinderUserStore(ISqlConnectionFactory connectionFactory)
    : IUserStore<PaperBinderUser>,
      IUserPasswordStore<PaperBinderUser>,
      IUserSecurityStampStore<PaperBinderUser>,
      IUserEmailStore<PaperBinderUser>
{
    public void Dispose()
    {
    }

    public async Task<IdentityResult> CreateAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
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
                cancellationToken: cancellationToken));

        return IdentityResult.Success;
    }

    public async Task<IdentityResult> UpdateAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var affectedRows = await connection.ExecuteAsync(
            new CommandDefinition(
                """
                update users
                set
                    user_name = @UserName,
                    normalized_user_name = @NormalizedUserName,
                    email = @Email,
                    normalized_email = @NormalizedEmail,
                    email_confirmed = @EmailConfirmed,
                    password_hash = @PasswordHash,
                    security_stamp = @SecurityStamp
                where id = @Id;
                """,
                user,
                cancellationToken: cancellationToken));

        return affectedRows == 1
            ? IdentityResult.Success
            : IdentityResult.Failed(new IdentityError
            {
                Code = "USER_NOT_FOUND",
                Description = "The requested user does not exist."
            });
    }

    public async Task<IdentityResult> DeleteAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var affectedRows = await connection.ExecuteAsync(
            new CommandDefinition(
                """
                delete from users
                where id = @Id;
                """,
                new { user.Id },
                cancellationToken: cancellationToken));

        return affectedRows == 1
            ? IdentityResult.Success
            : IdentityResult.Failed(new IdentityError
            {
                Code = "USER_NOT_FOUND",
                Description = "The requested user does not exist."
            });
    }

    public Task<string> GetUserIdAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.Id.ToString("D"));
    }

    public Task<string?> GetUserNameAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.UserName);
    }

    public Task SetUserNameAsync(PaperBinderUser user, string? userName, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.UserName = userName ?? string.Empty;
        return Task.CompletedTask;
    }

    public Task<string?> GetNormalizedUserNameAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.NormalizedUserName);
    }

    public Task SetNormalizedUserNameAsync(
        PaperBinderUser user,
        string? normalizedName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.NormalizedUserName = normalizedName ?? string.Empty;
        return Task.CompletedTask;
    }

    public async Task<PaperBinderUser?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(userId, out var parsedUserId))
        {
            return null;
        }

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<PaperBinderUser>(
            new CommandDefinition(
                """
                select
                    id as Id,
                    user_name as UserName,
                    normalized_user_name as NormalizedUserName,
                    email as Email,
                    normalized_email as NormalizedEmail,
                    email_confirmed as EmailConfirmed,
                    password_hash as PasswordHash,
                    security_stamp as SecurityStamp
                from users
                where id = @UserId;
                """,
                new { UserId = parsedUserId },
                cancellationToken: cancellationToken));
    }

    public async Task<PaperBinderUser?> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedUserName);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<PaperBinderUser>(
            new CommandDefinition(
                """
                select
                    id as Id,
                    user_name as UserName,
                    normalized_user_name as NormalizedUserName,
                    email as Email,
                    normalized_email as NormalizedEmail,
                    email_confirmed as EmailConfirmed,
                    password_hash as PasswordHash,
                    security_stamp as SecurityStamp
                from users
                where normalized_user_name = @NormalizedUserName;
                """,
                new { NormalizedUserName = normalizedUserName },
                cancellationToken: cancellationToken));
    }

    public Task SetPasswordHashAsync(PaperBinderUser user, string? passwordHash, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.PasswordHash = passwordHash ?? string.Empty;
        return Task.CompletedTask;
    }

    public Task<string?> GetPasswordHashAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.PasswordHash);
    }

    public Task<bool> HasPasswordAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(!string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    public Task SetSecurityStampAsync(PaperBinderUser user, string? stamp, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.SecurityStamp = stamp ?? string.Empty;
        return Task.CompletedTask;
    }

    public Task<string?> GetSecurityStampAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.SecurityStamp);
    }

    public Task SetEmailAsync(PaperBinderUser user, string? email, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.Email = email ?? string.Empty;
        return Task.CompletedTask;
    }

    public Task<string?> GetEmailAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.Email);
    }

    public Task<bool> GetEmailConfirmedAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult(user.EmailConfirmed);
    }

    public Task SetEmailConfirmedAsync(PaperBinderUser user, bool confirmed, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.EmailConfirmed = confirmed;
        return Task.CompletedTask;
    }

    public async Task<PaperBinderUser?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedEmail);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<PaperBinderUser>(
            new CommandDefinition(
                """
                select
                    id as Id,
                    user_name as UserName,
                    normalized_user_name as NormalizedUserName,
                    email as Email,
                    normalized_email as NormalizedEmail,
                    email_confirmed as EmailConfirmed,
                    password_hash as PasswordHash,
                    security_stamp as SecurityStamp
                from users
                where normalized_email = @NormalizedEmail;
                """,
                new { NormalizedEmail = normalizedEmail },
                cancellationToken: cancellationToken));
    }

    public Task<string?> GetNormalizedEmailAsync(PaperBinderUser user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        return Task.FromResult<string?>(user.NormalizedEmail);
    }

    public Task SetNormalizedEmailAsync(
        PaperBinderUser user,
        string? normalizedEmail,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(user);
        user.NormalizedEmail = normalizedEmail ?? string.Empty;
        return Task.CompletedTask;
    }
}
