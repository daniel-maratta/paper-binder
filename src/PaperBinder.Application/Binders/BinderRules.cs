using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public static class BinderNameRules
{
    public const int MaxLength = 200;

    public static bool TryNormalize(string? value, out string normalizedName)
    {
        normalizedName = value?.Trim() ?? string.Empty;
        return normalizedName.Length is > 0 and <= MaxLength;
    }
}

public static class BinderPolicyModeNames
{
    public const string Inherit = "inherit";
    public const string RestrictedRoles = "restricted_roles";

    public static bool TryParse(string? value, out BinderPolicyMode mode)
    {
        switch (value?.Trim())
        {
            case Inherit:
                mode = BinderPolicyMode.Inherit;
                return true;

            case RestrictedRoles:
                mode = BinderPolicyMode.RestrictedRoles;
                return true;

            default:
                mode = default;
                return false;
        }
    }

    public static string ToContractValue(BinderPolicyMode mode) =>
        mode switch
        {
            BinderPolicyMode.Inherit => Inherit,
            BinderPolicyMode.RestrictedRoles => RestrictedRoles,
            _ => throw new ArgumentOutOfRangeException(nameof(mode), mode, "Unknown binder policy mode.")
        };
}

public sealed record BinderPolicyValidationResult(
    bool Succeeded,
    BinderPolicy? Policy,
    string? Detail)
{
    public static BinderPolicyValidationResult Success(BinderPolicy policy) => new(true, policy, null);

    public static BinderPolicyValidationResult Failed(string detail) => new(false, null, detail);
}

public static class BinderPolicyRules
{
    public static BinderPolicyValidationResult ValidateAndNormalize(
        string? modeValue,
        IReadOnlyList<string>? allowedRoleValues)
    {
        if (!BinderPolicyModeNames.TryParse(modeValue, out var mode))
        {
            return BinderPolicyValidationResult.Failed(
                "The supplied binder policy mode is not supported.");
        }

        var normalizedRoles = NormalizeRoles(allowedRoleValues);
        if (!normalizedRoles.Succeeded)
        {
            return normalizedRoles;
        }

        if (mode == BinderPolicyMode.Inherit && normalizedRoles.Policy is { AllowedRoles.Count: > 0 })
        {
            return BinderPolicyValidationResult.Failed(
                "The `allowedRoles` collection must be empty when `mode` is `inherit`.");
        }

        if (mode == BinderPolicyMode.RestrictedRoles &&
            normalizedRoles.Policy is not { AllowedRoles.Count: > 0 })
        {
            return BinderPolicyValidationResult.Failed(
                "The `allowedRoles` collection must include at least one valid tenant role when `mode` is `restricted_roles`.");
        }

        var normalizedPolicy = new BinderPolicy(mode, normalizedRoles.Policy?.AllowedRoles ?? Array.Empty<TenantRole>());
        return BinderPolicyValidationResult.Success(normalizedPolicy);
    }

    private static BinderPolicyValidationResult NormalizeRoles(IReadOnlyList<string>? allowedRoleValues)
    {
        if (allowedRoleValues is null || allowedRoleValues.Count == 0)
        {
            return BinderPolicyValidationResult.Success(
                new BinderPolicy(BinderPolicyMode.Inherit, Array.Empty<TenantRole>()));
        }

        var roles = new List<TenantRole>(allowedRoleValues.Count);
        foreach (var value in allowedRoleValues)
        {
            var trimmedValue = value?.Trim();
            if (string.IsNullOrWhiteSpace(trimmedValue))
            {
                continue;
            }

            if (!TenantRoleParser.TryParse(trimmedValue, out var role))
            {
                return BinderPolicyValidationResult.Failed(
                    "The `allowedRoles` collection must contain only valid v1 tenant role values.");
            }

            roles.Add(role);
        }

        var normalizedRoles = roles
            .Distinct()
            .OrderBy(role => role)
            .ToArray();

        return BinderPolicyValidationResult.Success(
            new BinderPolicy(BinderPolicyMode.Inherit, normalizedRoles));
    }
}
