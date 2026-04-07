namespace PaperBinder.Application.Tenancy;

public static class TenantRoleParser
{
    public static bool TryParse(string? value, out TenantRole role)
    {
        switch (value)
        {
            case nameof(TenantRole.TenantAdmin):
                role = TenantRole.TenantAdmin;
                return true;

            case nameof(TenantRole.BinderWrite):
                role = TenantRole.BinderWrite;
                return true;

            case nameof(TenantRole.BinderRead):
                role = TenantRole.BinderRead;
                return true;

            default:
                role = default;
                return false;
        }
    }

    public static TenantRole Parse(string value) =>
        TryParse(value, out var role)
            ? role
            : throw new InvalidOperationException($"Unsupported tenant role value `{value}`.");
}
