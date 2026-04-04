using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

public interface IRequestTenantContext
{
    bool IsEstablished { get; }

    bool IsSystemContext { get; }

    TenantContext? Tenant { get; }
}
