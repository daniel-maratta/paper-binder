using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public sealed record BinderCreateCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    string? Name);

public sealed record BinderRenameCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    TenantRole CallerRole,
    Guid BinderId,
    string? Name);

public sealed record BinderDeleteCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    TenantRole CallerRole,
    Guid BinderId);

public sealed record BinderPolicyUpdateCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    Guid BinderId,
    string? Mode,
    IReadOnlyList<string>? AllowedRoles);
