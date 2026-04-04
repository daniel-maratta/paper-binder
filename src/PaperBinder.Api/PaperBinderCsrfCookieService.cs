using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal sealed class PaperBinderCsrfCookieService(PaperBinderRuntimeSettings runtimeSettings)
{
    public string CookieName => PaperBinderCsrfProtection.GetCookieName(runtimeSettings);

    public string IssueToken(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var token = PaperBinderCsrfProtection.CreateToken();
        context.Response.Cookies.Append(
            CookieName,
            token,
            CreateCookieOptions());

        return token;
    }

    public void ClearToken(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);
        context.Response.Cookies.Delete(CookieName, CreateCookieOptions());
    }

    private CookieOptions CreateCookieOptions() =>
        new()
        {
            Domain = runtimeSettings.AuthCookie.Domain,
            HttpOnly = false,
            IsEssential = true,
            Path = "/",
            SameSite = SameSiteMode.Lax,
            Secure = string.Equals(
                runtimeSettings.PublicUrl.RootUrl.Scheme,
                Uri.UriSchemeHttps,
                StringComparison.OrdinalIgnoreCase)
        };
}
