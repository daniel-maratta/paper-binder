namespace PaperBinder.Application.Tenancy;

public interface ITenantLookupService
{
    Task<ResolvedTenantHost?> FindBySlugAsync(
        string tenantSlug,
        CancellationToken cancellationToken = default);
}
