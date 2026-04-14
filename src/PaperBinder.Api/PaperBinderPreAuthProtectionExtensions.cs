using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal static class PaperBinderPreAuthProtectionExtensions
{
    public const string RootHostPreAuthPolicyName = "PaperBinder.RootHostPreAuth";
    public const string TenantLeaseExtendPolicyName = "PaperBinder.TenantLeaseExtend";

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

            options.AddPolicy(TenantLeaseExtendPolicyName, httpContext =>
            {
                if (!IsTenantLeaseExtendRequest(httpContext))
                {
                    return RateLimitPartition.GetNoLimiter("paperbinder-no-tenant-lease-extend-limit");
                }

                return RateLimitPartition.GetFixedWindowLimiter(
                    ResolveLeaseExtendPartitionKey(httpContext),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = runtimeSettings.RateLimits.LeaseExtendPerMinute,
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

    private static bool IsTenantLeaseExtendRequest(HttpContext context) =>
        HttpMethods.IsPost(context.Request.Method) &&
        string.Equals(
            context.Request.Path.Value,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            StringComparison.OrdinalIgnoreCase);

    private static string ResolveLeaseExtendPartitionKey(HttpContext context)
    {
        var requestTenantContext = context.RequestServices.GetRequiredService<IRequestTenantContext>();
        var requestMembershipContext = context.RequestServices.GetRequiredService<IRequestTenantMembershipContext>();
        if (requestTenantContext.Tenant is { } tenant &&
            requestMembershipContext.Membership is { } membership)
        {
            return $"{tenant.TenantId:D}:{membership.UserId:D}";
        }

        var requestHostContext = context.RequestServices.GetRequiredService<IRequestResolvedTenantHostContext>();
        if (requestHostContext.TenantHost is { } tenantHost)
        {
            return $"{tenantHost.Tenant.TenantId:D}:{ResolveClientPartitionKey(context)}";
        }

        return $"lease-extend:{ResolveClientPartitionKey(context)}";
    }

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

        var isTenantLeaseExtend = IsTenantLeaseExtendRequest(context.HttpContext);

        logger.LogWarning(
            "{RateLimitKind} rate limit rejected request. Path={Path} Host={Host} RemoteIp={RemoteIp} RetryAfterSeconds={RetryAfterSeconds} CorrelationId={CorrelationId}",
            isTenantLeaseExtend ? "Tenant lease extend" : "Pre-auth",
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
                isTenantLeaseExtend
                    ? "Too many tenant lease extension requests were submitted. Retry after the indicated delay."
                    : "Too many pre-auth requests were submitted. Retry after the indicated delay.",
                PaperBinderErrorCodes.RateLimited));
    }
}
