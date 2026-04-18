namespace PaperBinder.Application.Tenancy;

public sealed record TenantLeaseState(
    DateTimeOffset ExpiresAtUtc,
    int SecondsRemaining,
    int ExtensionCount,
    int MaxExtensions,
    bool CanExtend);

public sealed record TenantLeaseSnapshot(
    Guid TenantId,
    string TenantSlug,
    DateTimeOffset ExpiresAtUtc,
    int ExtensionCount);

public sealed record TenantLeasePolicy(
    int ExtensionMinutes,
    int MaxExtensions);

public sealed record TenantLeaseExtendCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated);

public enum TenantLeaseFailureKind
{
    NotFound,
    ExtensionWindowNotOpen,
    ExtensionLimitReached
}

public sealed record TenantLeaseFailure(
    TenantLeaseFailureKind Kind,
    string Detail);

public sealed record TenantLeaseReadOutcome(
    bool Succeeded,
    TenantLeaseState? Lease,
    TenantLeaseFailure? Failure)
{
    public static TenantLeaseReadOutcome Success(TenantLeaseState lease) => new(true, lease, null);

    public static TenantLeaseReadOutcome Failed(TenantLeaseFailure failure) => new(false, null, failure);
}

public sealed record TenantLeaseExtendOutcome(
    bool Succeeded,
    TenantLeaseState? Lease,
    TenantLeaseFailure? Failure)
{
    public static TenantLeaseExtendOutcome Success(TenantLeaseState lease) => new(true, lease, null);

    public static TenantLeaseExtendOutcome Failed(TenantLeaseFailure failure) => new(false, null, failure);
}

public sealed record TenantLeaseCleanupCycleResult(
    int SelectedTenantCount,
    int PurgedTenantCount,
    int SkippedTenantCount,
    int FailedTenantCount);
