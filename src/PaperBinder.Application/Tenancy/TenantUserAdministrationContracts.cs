namespace PaperBinder.Application.Tenancy;

public sealed record TenantUserSummary(
    Guid UserId,
    string Email,
    TenantRole Role,
    bool IsOwner);

public sealed record TenantUserCreateCommand(
    Guid TenantId,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    string Email,
    string Password,
    string Role);

public sealed record TenantUserRoleChangeCommand(
    Guid TenantId,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    Guid TargetUserId,
    string Role);

public sealed record TenantUserDeleteCommand(
    Guid TenantId,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    Guid TargetUserId);

public enum TenantUserAdministrationFailureKind
{
    UserNotFound,
    EmailConflict,
    InvalidRole,
    InvalidPassword,
    LastTenantAdminRequired,
    LastTenantOwnerRequired
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

public sealed record TenantUserDeleteOutcome(
    bool Succeeded,
    TenantUserAdministrationFailure? Failure)
{
    public static TenantUserDeleteOutcome Success() =>
        new(true, null);

    public static TenantUserDeleteOutcome Failed(TenantUserAdministrationFailure failure) =>
        new(false, failure);
}
