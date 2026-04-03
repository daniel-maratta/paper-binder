using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal interface IRequestTenantContextSetter
{
    void EstablishSystem();

    void EstablishTenant(TenantContext tenant);
}

internal sealed class PaperBinderTenantRequestContext : IRequestTenantContext, IRequestTenantContextSetter
{
    public bool IsEstablished { get; private set; }

    public bool IsSystemContext { get; private set; }

    public TenantContext? Tenant { get; private set; }

    public void EstablishSystem()
    {
        EnsureNotEstablished();
        IsEstablished = true;
        IsSystemContext = true;
    }

    public void EstablishTenant(TenantContext tenant)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        EnsureNotEstablished();
        IsEstablished = true;
        Tenant = tenant;
    }

    private void EnsureNotEstablished()
    {
        if (IsEstablished)
        {
            throw new InvalidOperationException("The request tenant context can only be established once per request.");
        }
    }
}
