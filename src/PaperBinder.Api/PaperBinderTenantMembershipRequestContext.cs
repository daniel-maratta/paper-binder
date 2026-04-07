using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal interface IRequestTenantMembershipContext
{
    bool IsEstablished { get; }

    TenantMembership? Membership { get; }
}

internal interface IRequestTenantMembershipContextSetter
{
    void Establish(TenantMembership membership);
}

internal sealed class PaperBinderTenantMembershipRequestContext
    : IRequestTenantMembershipContext, IRequestTenantMembershipContextSetter
{
    public bool IsEstablished { get; private set; }

    public TenantMembership? Membership { get; private set; }

    public void Establish(TenantMembership membership)
    {
        ArgumentNullException.ThrowIfNull(membership);

        EnsureNotEstablished();
        IsEstablished = true;
        Membership = membership;
    }

    private void EnsureNotEstablished()
    {
        if (IsEstablished)
        {
            throw new InvalidOperationException("The request tenant membership context can only be established once per request.");
        }
    }
}
