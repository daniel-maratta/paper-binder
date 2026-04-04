using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

internal static class TenantRoleParser
{
    public static TenantRole Parse(string value) =>
        value switch
        {
            nameof(TenantRole.TenantAdmin) => TenantRole.TenantAdmin,
            nameof(TenantRole.BinderWrite) => TenantRole.BinderWrite,
            nameof(TenantRole.BinderRead) => TenantRole.BinderRead,
            _ => throw new InvalidOperationException($"Unsupported tenant role value `{value}`.")
        };
}
