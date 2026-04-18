using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;

namespace PaperBinder.Api;

internal static class PaperBinderImpersonationClaims
{
    public const string EffectiveUserIdClaimType = "paperbinder.impersonation.effective_user_id";
    public const string SessionIdClaimType = "paperbinder.impersonation.session_id";

    public static IReadOnlyList<Claim> Create(Guid effectiveUserId, Guid sessionId) =>
    [
        new Claim(EffectiveUserIdClaimType, effectiveUserId.ToString("D")),
        new Claim(SessionIdClaimType, sessionId.ToString("D"))
    ];

    public static bool TryGetEffectiveUserId(ClaimsPrincipal principal, out Guid effectiveUserId)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var rawValue = principal.FindFirstValue(EffectiveUserIdClaimType);
        return Guid.TryParse(rawValue, out effectiveUserId);
    }

    public static bool TryGetSessionId(ClaimsPrincipal principal, out Guid sessionId)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var rawValue = principal.FindFirstValue(SessionIdClaimType);
        return Guid.TryParse(rawValue, out sessionId);
    }

    public static bool TryGetState(
        ClaimsPrincipal principal,
        out Guid effectiveUserId,
        out Guid sessionId)
    {
        effectiveUserId = Guid.Empty;
        sessionId = Guid.Empty;

        return TryGetEffectiveUserId(principal, out effectiveUserId) &&
               TryGetSessionId(principal, out sessionId);
    }

    public static bool TryGetState(
        AuthenticationTicket ticket,
        out Guid effectiveUserId,
        out Guid sessionId)
    {
        ArgumentNullException.ThrowIfNull(ticket);
        return TryGetState(ticket.Principal, out effectiveUserId, out sessionId);
    }
}
