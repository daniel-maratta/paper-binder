namespace PaperBinder.Application.Tenancy;

public interface ITenantLookupService
{
    Task<TenantContext?> FindBySlugAsync(
        string tenantSlug,
        CancellationToken cancellationToken = default);
}
