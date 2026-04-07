namespace PaperBinder.Application.Tenancy;

public interface ITenantUserAdministrationService
{
    Task<IReadOnlyList<TenantUserSummary>> ListUsersAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<TenantUserCreateOutcome> CreateUserAsync(
        TenantUserCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<TenantUserRoleChangeOutcome> ChangeRoleAsync(
        TenantUserRoleChangeCommand command,
        CancellationToken cancellationToken = default);
}

public sealed record TenantUserSummary(
    Guid UserId,
    string Email,
    TenantRole Role,
    bool IsOwner);

public sealed record TenantUserCreateCommand(
    Guid TenantId,
    Guid ActorUserId,
    string Email,
    string Password,
    string Role);

public sealed record TenantUserRoleChangeCommand(
    Guid TenantId,
    Guid ActorUserId,
    Guid TargetUserId,
    string Role);

public enum TenantUserAdministrationFailureKind
{
    UserNotFound,
    EmailConflict,
    InvalidRole,
    InvalidPassword,
    LastTenantAdminRequired
}

public sealed record TenantUserAdministrationFailure(
    TenantUserAdministrationFailureKind Kind,
    string Detail,
    IReadOnlyList<string>? ValidationMessages = null);

public sealed record TenantUserCreateOutcome(
    bool Succeeded,
    TenantUserSummary? User,
    TenantUserAdministrationFailure? Failure)
{
    public static TenantUserCreateOutcome Success(TenantUserSummary user) =>
        new(true, user, null);

    public static TenantUserCreateOutcome Failed(TenantUserAdministrationFailure failure) =>
        new(false, null, failure);
}

public sealed record TenantUserRoleChangeOutcome(
    bool Succeeded,
    TenantUserSummary? User,
    TenantUserAdministrationFailure? Failure)
{
    public static TenantUserRoleChangeOutcome Success(TenantUserSummary user) =>
        new(true, user, null);

    public static TenantUserRoleChangeOutcome Failed(TenantUserAdministrationFailure failure) =>
        new(false, null, failure);
}
