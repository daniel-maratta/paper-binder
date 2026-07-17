using System.Globalization;
using System.Text;

namespace PaperBinder.Application.Provisioning;

public interface ITenantProvisioningService
{
    Task<TenantProvisioningOutcome> ProvisionAsync(
        string tenantName,
        CancellationToken cancellationToken = default);
}

public sealed record TenantProvisioningOutcome(
    ProvisionedTenant? ProvisionedTenant,
    TenantProvisioningFailure? Failure)
{
    public bool Succeeded => ProvisionedTenant is not null;

    public static TenantProvisioningOutcome Success(ProvisionedTenant provisionedTenant) =>
        new(provisionedTenant, null);

    public static TenantProvisioningOutcome InvalidTenantName(string detail) =>
        new(null, new TenantProvisioningFailure(TenantProvisioningFailureKind.InvalidTenantName, detail));

    public static TenantProvisioningOutcome TenantNameConflict(string detail) =>
        new(null, new TenantProvisioningFailure(TenantProvisioningFailureKind.TenantNameConflict, detail));
}

public sealed record ProvisionedTenant(
    Guid TenantId,
    Guid OwnerUserId,
    string TenantName,
    string TenantSlug,
    DateTimeOffset ExpiresAtUtc,
    string OwnerEmail,
    string GeneratedPassword);

public sealed record TenantProvisioningFailure(
    TenantProvisioningFailureKind Kind,
    string Detail);

public enum TenantProvisioningFailureKind
{
    InvalidTenantName,
    TenantNameConflict
}

public sealed record NormalizedTenantProvisioningName(
    string TenantName,
    string TenantSlug);

public static class TenantProvisioningRules
{
    public const int MaxTenantNameLength = 200;
    public const int MaxTenantSlugLength = 63;
    public static bool TryNormalizeTenantName(
        string tenantName,
        out NormalizedTenantProvisioningName? normalized)
    {
        normalized = null;

        if (string.IsNullOrWhiteSpace(tenantName))
        {
            return false;
        }

        var trimmedTenantName = tenantName.Trim();
        if (trimmedTenantName.Length is 0 or > MaxTenantNameLength)
        {
            return false;
        }

        var tenantSlug = BuildTenantSlug(trimmedTenantName);
        if (tenantSlug.Length == 0)
        {
            return false;
        }

        normalized = new NormalizedTenantProvisioningName(trimmedTenantName, tenantSlug);
        return true;
    }
    private static string BuildTenantSlug(string tenantName)
    {
        var builder = new StringBuilder(MaxTenantSlugLength);
        var separatorPending = false;

        foreach (var character in tenantName.Normalize(NormalizationForm.FormKD))
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (IsAsciiLetterOrDigit(character))
            {
                if (separatorPending && builder.Length > 0)
                {
                    if (builder.Length == MaxTenantSlugLength)
                    {
                        break;
                    }

                    builder.Append('-');
                }

                if (builder.Length == MaxTenantSlugLength)
                {
                    break;
                }

                builder.Append(char.ToLowerInvariant(character));
                separatorPending = false;
                continue;
            }

            if (builder.Length > 0)
            {
                separatorPending = true;
            }
        }

        return builder
            .ToString()
            .Trim('-');
    }

    private static bool IsAsciiLetterOrDigit(char character) =>
        character is >= 'a' and <= 'z' or >= 'A' and <= 'Z' or >= '0' and <= '9';
}
