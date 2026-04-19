using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Api;

internal sealed class PaperBinderEndpointHostRequirementMiddleware(
    RequestDelegate next,
    IProblemDetailsService problemDetailsService,
    ILogger<PaperBinderEndpointHostRequirementMiddleware> logger)
{
    public async Task InvokeAsync(
        HttpContext context,
        IRequestResolvedTenantHostContext requestHostContext)
    {
        var hostRequirement = context.GetEndpoint()
            ?.Metadata
            .GetMetadata<PaperBinderResolvedEndpointHostMetadata>();

        if (hostRequirement is null || AllowsRequest(requestHostContext, hostRequirement.RequiredHostKind))
        {
            await next(context);
            return;
        }

        PaperBinderTelemetry.RecordSecurityDenial(
            PaperBinderTelemetry.SecurityDenialReasons.EndpointHostMismatch,
            PaperBinderTelemetry.SecurityDenialSurfaces.EndpointHostRequirement);
        logger.LogWarning(
            "Endpoint host requirement rejected request. event_name={event_name} reason={reason} surface={surface} path={path} host={host} required_host_kind={required_host_kind} correlation_id={correlation_id}",
            "security_denial",
            PaperBinderTelemetry.SecurityDenialReasons.EndpointHostMismatch,
            PaperBinderTelemetry.SecurityDenialSurfaces.EndpointHostRequirement,
            context.Request.Path.Value ?? string.Empty,
            context.Request.Host.Host,
            hostRequirement.RequiredHostKind.ToString(),
            PaperBinderRequestCorrelation.Get(context) ?? string.Empty);

        if (PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status404NotFound);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status404NotFound;
    }

    private static bool AllowsRequest(
        IRequestResolvedTenantHostContext requestHostContext,
        PaperBinderResolvedEndpointHostKind requiredHostKind) =>
        requiredHostKind switch
        {
            PaperBinderResolvedEndpointHostKind.System => requestHostContext.IsSystemHost,
            PaperBinderResolvedEndpointHostKind.Tenant => requestHostContext.IsTenantHost,
            _ => false
        };
}
