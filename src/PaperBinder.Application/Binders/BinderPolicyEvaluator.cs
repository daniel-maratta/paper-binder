using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public interface IBinderPolicyEvaluator
{
    bool CanAccess(TenantRole callerRole, BinderPolicy policy);
}

public sealed class BinderPolicyEvaluator : IBinderPolicyEvaluator
{
    public bool CanAccess(TenantRole callerRole, BinderPolicy policy) =>
        policy.Mode switch
        {
            BinderPolicyMode.Inherit => true,
            BinderPolicyMode.RestrictedRoles => policy.AllowedRoles.Contains(callerRole),
            _ => throw new ArgumentOutOfRangeException(nameof(policy), policy.Mode, "Unknown binder policy mode.")
        };
}
