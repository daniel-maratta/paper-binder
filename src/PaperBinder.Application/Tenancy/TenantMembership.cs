namespace PaperBinder.Application.Tenancy;

public enum TenantRole
{
    TenantAdmin,
    BinderWrite,
    BinderRead
}

public sealed record TenantMembership(
    Guid UserId,
    Guid TenantId,
    TenantRole Role,
    bool IsOwner);

public sealed record ResolvedTenantMembership(
    TenantMembership Membership,
    ResolvedTenantHost TenantHost);
