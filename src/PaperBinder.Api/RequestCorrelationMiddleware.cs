using Microsoft.Extensions.Logging;

namespace PaperBinder.Api;

internal sealed class RequestCorrelationMiddleware(
    RequestDelegate next,
    ILogger<RequestCorrelationMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = PaperBinderRequestCorrelation.Resolve(context);

        context.Response.OnStarting(static state =>
        {
            var (httpContext, resolvedCorrelationId) = ((HttpContext, string))state;
            httpContext.Response.Headers[PaperBinderHttpHeaders.CorrelationId] = resolvedCorrelationId;
            return Task.CompletedTask;
        }, (context, correlationId));

        using var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["correlation_id"] = correlationId
        });

        await next(context);
    }
}
