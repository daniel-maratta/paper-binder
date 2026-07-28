namespace PaperBinder.Api;

/// <summary>
/// Emits baseline, zero-config-risk security response headers on every response.
/// Deliberately excludes Content-Security-Policy and Strict-Transport-Security: CSP needs
/// per-route validation against the SPA's actual script/style sources before it can be
/// locked safely (see docs/30-security/threat-model-lite.md), and HSTS is only meaningful
/// where TLS terminates, which for this app is the reverse proxy (deploy/test and
/// deploy/prod Caddyfiles), not this in-process app.
/// </summary>
internal sealed class SecurityResponseHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(static state =>
        {
            var response = (HttpResponse)state;
            response.Headers["X-Content-Type-Options"] = "nosniff";
            response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            response.Headers["X-Frame-Options"] = "DENY";
            return Task.CompletedTask;
        }, context.Response);

        return next(context);
    }
}
