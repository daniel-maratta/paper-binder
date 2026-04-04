using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal interface IRequestResolvedTenantHostContext
{
    bool IsEstablished { get; }

    bool IsSystemHost { get; }

    bool IsTenantHost { get; }

    ResolvedTenantHost? TenantHost { get; }
}

internal interface IRequestResolvedTenantHostContextSetter
{
    void EstablishSystemHost();

    void EstablishTenantHost(ResolvedTenantHost tenantHost);
}

internal sealed class PaperBinderResolvedTenantHostContext
    : IRequestResolvedTenantHostContext, IRequestResolvedTenantHostContextSetter
{
    public bool IsEstablished { get; private set; }

    public bool IsSystemHost { get; private set; }

    public bool IsTenantHost => TenantHost is not null;

    public ResolvedTenantHost? TenantHost { get; private set; }

    public void EstablishSystemHost()
    {
        EnsureNotEstablished();
        IsEstablished = true;
        IsSystemHost = true;
    }

    public void EstablishTenantHost(ResolvedTenantHost tenantHost)
    {
        ArgumentNullException.ThrowIfNull(tenantHost);

        EnsureNotEstablished();
        IsEstablished = true;
        TenantHost = tenantHost;
    }

    private void EnsureNotEstablished()
    {
        if (IsEstablished)
        {
            throw new InvalidOperationException("The resolved tenant host context can only be established once per request.");
        }
    }
}
