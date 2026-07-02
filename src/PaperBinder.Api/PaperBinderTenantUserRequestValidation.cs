using System.Net.Mail;

namespace PaperBinder.Api;

internal static class PaperBinderTenantUserRequestValidation
{
    public static bool TryTrimToValidEmailAddress(string? value, out string emailAddress)
    {
        emailAddress = value?.Trim() ?? string.Empty;
        if (emailAddress.Length is 0 or > 256)
        {
            return false;
        }

        return MailAddress.TryCreate(emailAddress, out var parsedAddress) &&
               string.Equals(parsedAddress.Address, emailAddress, StringComparison.OrdinalIgnoreCase);
    }
}
