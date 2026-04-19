using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Api;

internal sealed class PaperBinderAuthenticatedMutationRateLimitMiddleware(
    RequestDelegate next,
    PaperBinderRuntimeSettings runtimeSettings,
    IProblemDetailsService problemDetailsService,
    ILogger<PaperBinderAuthenticatedMutationRateLimitMiddleware> logger)
{
    private readonly PartitionedRateLimiter<HttpContext> limiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        if (!ShouldApply(context))
        {
            return RateLimitPartition.GetNoLimiter("paperbinder-no-authenticated-mutation-limit");
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            ResolvePartitionKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = runtimeSettings.RateLimits.AuthenticatedPerMinute,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ShouldApply(context))
        {
            await next(context);
            return;
        }

        using var lease = await limiter.AcquireAsync(context, 1, context.RequestAborted);
        if (lease.IsAcquired)
        {
            await next(context);
            return;
        }

        var tenantContext = context.RequestServices.GetRequiredService<IRequestTenantContext>();
        var executionUserContext = context.RequestServices.GetRequiredService<IRequestExecutionUserContext>();
        var retryAfterSeconds = default(int?);

        if (lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            retryAfterSeconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
            context.Response.Headers["Retry-After"] = retryAfterSeconds.Value.ToString(CultureInfo.InvariantCulture);
        }

        PaperBinderTelemetry.RecordRateLimitRejection(
            PaperBinderTelemetry.RateLimitPolicies.AuthenticatedTenantMutation,
            PaperBinderTelemetry.RateLimitSurfaces.TenantHost);

        logger.LogWarning(
            "Authenticated tenant mutation rate limit rejected request. event_name={event_name} policy={policy} surface={surface} tenant_id={tenant_id} user_id={user_id} path={path} host={host} retry_after_seconds={retry_after_seconds} correlation_id={correlation_id}",
            "rate_limit_rejected",
            PaperBinderTelemetry.RateLimitPolicies.AuthenticatedTenantMutation,
            PaperBinderTelemetry.RateLimitSurfaces.TenantHost,
            tenantContext.Tenant?.TenantId,
            executionUserContext.EffectiveUserId,
            context.Request.Path.Value ?? string.Empty,
            context.Request.Host.Host,
            retryAfterSeconds,
            PaperBinderRequestCorrelation.Get(context) ?? string.Empty);

        await PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            StatusCodes.Status429TooManyRequests,
            "Rate limit exceeded.",
            "Too many authenticated tenant mutations were submitted. Retry after the indicated delay.",
            PaperBinderErrorCodes.RateLimited);
    }

    private static bool ShouldApply(HttpContext context)
    {
        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path) ||
            !IsUnsafeMethod(context.Request.Method) ||
            context.User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        var requestHostContext = context.RequestServices.GetRequiredService<IRequestResolvedTenantHostContext>();
        if (!requestHostContext.IsTenantHost)
        {
            return false;
        }

        return !IsExemptPath(context.Request.Method, context.Request.Path);
    }

    private static bool IsUnsafeMethod(string method) =>
        !HttpMethods.IsGet(method) &&
        !HttpMethods.IsHead(method) &&
        !HttpMethods.IsOptions(method) &&
        !HttpMethods.IsTrace(method);

    private static bool IsExemptPath(string method, PathString path) =>
        (HttpMethods.IsPost(method) && PaperBinderAuthRoutes.IsLogoutRoute(path)) ||
        (HttpMethods.IsDelete(method) && PaperBinderImpersonationRoutes.IsStopRoute(path));

    private static string ResolvePartitionKey(HttpContext context)
    {
        var tenantContext = context.RequestServices.GetRequiredService<IRequestTenantContext>();
        var executionUserContext = context.RequestServices.GetRequiredService<IRequestExecutionUserContext>();
        var tenant = tenantContext.Tenant
            ?? throw new InvalidOperationException(
                "Authenticated tenant mutation rate limiting requires an established tenant context.");

        if (!executionUserContext.IsEstablished)
        {
            throw new InvalidOperationException(
                "Authenticated tenant mutation rate limiting requires an established execution user context.");
        }

        return $"{tenant.TenantId:D}:{executionUserContext.EffectiveUserId:D}";
    }
}
