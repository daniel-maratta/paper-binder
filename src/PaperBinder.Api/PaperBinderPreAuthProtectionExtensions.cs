using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal static class PaperBinderPreAuthProtectionExtensions
{
    public const string RootHostPreAuthPolicyName = "PaperBinder.RootHostPreAuth";

    public static IServiceCollection AddPaperBinderPreAuthProtection(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);

        services.AddHttpClient<IChallengeVerificationService, TurnstileChallengeVerificationService>();
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRateLimitProblemAsync;
            options.AddPolicy(RootHostPreAuthPolicyName, httpContext =>
            {
                var requestHostContext = httpContext.RequestServices.GetRequiredService<IRequestResolvedTenantHostContext>();
                if (!requestHostContext.IsSystemHost ||
                    !PaperBinderAuthRoutes.IsRootHostPreAuthRoute(httpContext.Request.Path))
                {
                    return RateLimitPartition.GetNoLimiter("paperbinder-no-root-host-preauth-limit");
                }

                return RateLimitPartition.GetFixedWindowLimiter(
                    ResolveClientPartitionKey(httpContext),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = runtimeSettings.RateLimits.PreAuthPerMinute,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0,
                        AutoReplenishment = true
                    });
            });
        });

        return services;
    }

    public static void UsePaperBinderPreAuthProtection(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);
        app.UseRateLimiter();
    }

    private static string ResolveClientPartitionKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static ValueTask WriteRateLimitProblemAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(PaperBinderPreAuthProtectionExtensions).FullName!);

        var retryAfterSeconds = default(int?);
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            retryAfterSeconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
            context.HttpContext.Response.Headers["Retry-After"] = retryAfterSeconds.Value.ToString(CultureInfo.InvariantCulture);
        }

        logger.LogWarning(
            "Pre-auth rate limit rejected request. Path={Path} Host={Host} RemoteIp={RemoteIp} RetryAfterSeconds={RetryAfterSeconds} CorrelationId={CorrelationId}",
            context.HttpContext.Request.Path.Value ?? string.Empty,
            context.HttpContext.Request.Host.Host,
            context.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            retryAfterSeconds,
            PaperBinderRequestCorrelation.Get(context.HttpContext) ?? string.Empty);

        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.HttpContext.Request.Path))
        {
            context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            return ValueTask.CompletedTask;
        }

        return new ValueTask(
            PaperBinderProblemDetails.WriteApiProblemAsync(
                context.HttpContext,
                context.HttpContext.RequestServices.GetRequiredService<IProblemDetailsService>(),
                StatusCodes.Status429TooManyRequests,
                "Rate limit exceeded.",
                "Too many pre-auth requests were submitted. Retry after the indicated delay.",
                PaperBinderErrorCodes.RateLimited));
    }
}
