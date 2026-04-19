using System.Diagnostics;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Api;

internal sealed class RequestCorrelationMiddleware(
    RequestDelegate next,
    ILogger<RequestCorrelationMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = PaperBinderRequestCorrelation.Resolve(context);
        var traceId = Activity.Current?.TraceId.ToString();

        Activity.Current?.SetTag(PaperBinderTelemetry.ActivityTags.CorrelationId, correlationId);

        context.Response.OnStarting(static state =>
        {
            var (httpContext, resolvedCorrelationId) = ((HttpContext, string))state;
            httpContext.Response.Headers[PaperBinderHttpHeaders.CorrelationId] = resolvedCorrelationId;
            return Task.CompletedTask;
        }, (context, correlationId));

        using var scope = logger.BeginScope(new Dictionary<string, object?>
        {
            ["correlation_id"] = correlationId,
            ["trace_id"] = traceId
        });

        await next(context);
    }
}
