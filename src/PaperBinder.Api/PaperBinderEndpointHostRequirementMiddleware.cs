using Microsoft.AspNetCore.Mvc;

namespace PaperBinder.Api;

internal sealed class PaperBinderEndpointHostRequirementMiddleware(
    RequestDelegate next,
    IProblemDetailsService problemDetailsService)
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
