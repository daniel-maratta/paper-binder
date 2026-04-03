namespace PaperBinder.Application.Tenancy;

public sealed record TenantContext(
    Guid TenantId,
    string TenantSlug,
    string TenantName);
