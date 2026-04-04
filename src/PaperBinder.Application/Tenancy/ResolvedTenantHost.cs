namespace PaperBinder.Application.Tenancy;

public sealed record ResolvedTenantHost(
    TenantContext Tenant,
    DateTimeOffset ExpiresAtUtc);
