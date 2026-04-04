namespace PaperBinder.Application.Tenancy;

public interface ITenantMembershipLookupService
{
    Task<TenantMembership?> FindMembershipAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<ResolvedTenantMembership?> FindSingleMembershipAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
