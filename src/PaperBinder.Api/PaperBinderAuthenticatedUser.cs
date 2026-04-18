using System.Security.Claims;

namespace PaperBinder.Api;

internal static class PaperBinderAuthenticatedUser
{
    public static bool TryGetUserId(ClaimsPrincipal principal, out Guid userId)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var rawUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub");

        return Guid.TryParse(rawUserId, out userId);
    }

    public static bool TryGetSecurityStamp(
        ClaimsPrincipal principal,
        string claimType,
        out string securityStamp)
    {
        ArgumentNullException.ThrowIfNull(principal);
        ArgumentException.ThrowIfNullOrWhiteSpace(claimType);

        securityStamp = principal.FindFirstValue(claimType) ?? string.Empty;
        return !string.IsNullOrWhiteSpace(securityStamp);
    }
}
