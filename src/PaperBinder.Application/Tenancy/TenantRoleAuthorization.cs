namespace PaperBinder.Application.Tenancy;

public static class TenantRoleAuthorization
{
    public static bool Satisfies(TenantRole grantedRole, TenantRole requiredRole) =>
        grantedRole switch
        {
            TenantRole.TenantAdmin => true,
            TenantRole.BinderWrite => requiredRole is TenantRole.BinderWrite or TenantRole.BinderRead,
            TenantRole.BinderRead => requiredRole == TenantRole.BinderRead,
            _ => false
        };
}
