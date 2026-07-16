using System.Globalization;
using System.Security.Cryptography;
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
    public const int GeneratedPasswordLength = 20;

    private const string LowercaseAlphabet = "abcdefghjkmnpqrstuvwxyz";
    private const string UppercaseAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string DigitAlphabet = "23456789";
    private const string PasswordAlphabet = LowercaseAlphabet + UppercaseAlphabet + DigitAlphabet;

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

    public static string GenerateOneTimePassword()
    {
        var characters = new char[GeneratedPasswordLength];
        characters[0] = Pick(LowercaseAlphabet);
        characters[1] = Pick(UppercaseAlphabet);
        characters[2] = Pick(DigitAlphabet);

        for (var index = 3; index < characters.Length; index++)
        {
            characters[index] = Pick(PasswordAlphabet);
        }

        Shuffle(characters);
        return new string(characters);
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

    private static char Pick(string alphabet) =>
        alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];

    private static void Shuffle(char[] characters)
    {
        for (var index = characters.Length - 1; index > 0; index--)
        {
            var swapIndex = RandomNumberGenerator.GetInt32(index + 1);
            (characters[index], characters[swapIndex]) = (characters[swapIndex], characters[index]);
        }
    }
}
