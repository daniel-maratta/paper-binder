namespace PaperBinder.Application.Tenancy;

public static class TenantUserAdministrationRules
{
    public static bool WouldDemoteLastAdmin(
        TenantRole currentRole,
        TenantRole requestedRole,
        int tenantAdminCount) =>
        currentRole == TenantRole.TenantAdmin &&
        requestedRole != TenantRole.TenantAdmin &&
        tenantAdminCount <= 1;

    public static bool WouldDeleteLastAdmin(
        TenantRole currentRole,
        int tenantAdminCount) =>
        currentRole == TenantRole.TenantAdmin &&
        tenantAdminCount <= 1;

    public static bool WouldDeleteLastOwner(
        bool isOwner,
        int tenantOwnerCount) =>
        isOwner &&
        tenantOwnerCount <= 1;
}
