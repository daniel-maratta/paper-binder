using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Primitives;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal static class PaperBinderCsrfProtection
{
    public const string HeaderName = "X-CSRF-TOKEN";

    public static string GetCookieName(PaperBinderRuntimeSettings runtimeSettings)
    {
        ArgumentNullException.ThrowIfNull(runtimeSettings);
        return runtimeSettings.AuthCookie.Name + ".csrf";
    }

    public static string CreateToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    public static bool IsValid(string? cookieValue, StringValues headerValues)
    {
        if (string.IsNullOrWhiteSpace(cookieValue) ||
            headerValues.Count != 1 ||
            string.IsNullOrWhiteSpace(headerValues[0]))
        {
            return false;
        }

        var cookieBytes = Encoding.UTF8.GetBytes(cookieValue);
        var headerBytes = Encoding.UTF8.GetBytes(headerValues[0]!);

        return CryptographicOperations.FixedTimeEquals(cookieBytes, headerBytes);
    }
}
