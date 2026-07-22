using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public sealed record BinderSummary(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAtUtc);

public sealed record BinderDetail(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAtUtc);

public sealed record BinderPolicy(
    BinderPolicyMode Mode,
    IReadOnlyList<TenantRole> AllowedRoles);

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

public enum BinderPolicyMode
{
    Inherit,
    RestrictedRoles
}

public enum BinderFailureKind
{
    NameInvalid,
    NotFound,
    PolicyDenied,
    PolicyInvalid,
    LimitReached
}

public sealed record BinderFailure(
    BinderFailureKind Kind,
    string Detail);

public sealed record BinderCreateOutcome(
    bool Succeeded,
    BinderSummary? Binder,
    BinderFailure? Failure)
{
    public static BinderCreateOutcome Success(BinderSummary binder) => new(true, binder, null);

    public static BinderCreateOutcome Failed(BinderFailure failure) => new(false, null, failure);
}

public sealed record BinderDetailOutcome(
    bool Succeeded,
    BinderDetail? Binder,
    BinderFailure? Failure)
{
    public static BinderDetailOutcome Success(BinderDetail binder) => new(true, binder, null);

    public static BinderDetailOutcome Failed(BinderFailure failure) => new(false, null, failure);
}

public sealed record BinderPolicyReadOutcome(
    bool Succeeded,
    BinderPolicy? Policy,
    BinderFailure? Failure)
{
    public static BinderPolicyReadOutcome Success(BinderPolicy policy) => new(true, policy, null);

    public static BinderPolicyReadOutcome Failed(BinderFailure failure) => new(false, null, failure);
}

public sealed record BinderPolicyUpdateOutcome(
    bool Succeeded,
    BinderPolicy? Policy,
    BinderFailure? Failure)
{
    public static BinderPolicyUpdateOutcome Success(BinderPolicy policy) => new(true, policy, null);

    public static BinderPolicyUpdateOutcome Failed(BinderFailure failure) => new(false, null, failure);
}

public sealed record BinderRenameOutcome(
    bool Succeeded,
    BinderSummary? Binder,
    BinderFailure? Failure)
{
    public static BinderRenameOutcome Success(BinderSummary binder) => new(true, binder, null);

    public static BinderRenameOutcome Failed(BinderFailure failure) => new(false, null, failure);
}

public sealed record BinderDeleteOutcome(
    bool Succeeded,
    BinderFailure? Failure)
{
    public static BinderDeleteOutcome Success() => new(true, null);

    public static BinderDeleteOutcome Failed(BinderFailure failure) => new(false, failure);
}
