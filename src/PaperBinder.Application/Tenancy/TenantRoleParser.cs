namespace PaperBinder.Application.Tenancy;

public static class TenantRoleParser
{
    public static bool TryParse(string? value, out TenantRole role)
    {
        // Tenant roles cross API and persistence boundaries as canonical symbolic names, so
        // mixed-case variants and numeric enum values stay outside the accepted contract.
        if (Enum.TryParse<TenantRole>(value, ignoreCase: false, out var parsedRole) &&
            Enum.IsDefined(parsedRole) &&
            string.Equals(value, parsedRole.ToString(), StringComparison.Ordinal))
        {
            role = parsedRole;
            return true;
        }

        role = default;
        return false;
    }

    public static TenantRole Parse(string value) =>
        TryParse(value, out var role)
            ? role
            : throw new InvalidOperationException($"Unsupported tenant role value `{value}`.");
}
