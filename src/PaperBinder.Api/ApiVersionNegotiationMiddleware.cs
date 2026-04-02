namespace PaperBinder.Api;

internal sealed class ApiVersionNegotiationMiddleware(
    RequestDelegate next,
    IProblemDetailsService problemDetailsService)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.Request.Path))
        {
            await next(context);
            return;
        }

        if (!PaperBinderApiVersioning.TryResolveRequestedVersion(
                context.Request.Headers[PaperBinderHttpHeaders.ApiVersion],
                out var negotiatedVersion))
        {
            context.Response.Headers[PaperBinderHttpHeaders.ApiVersion] = PaperBinderApiVersioning.CurrentVersion;

            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status400BadRequest,
                title: "Unsupported API version.",
                detail: "Supported API versions: 1.",
                errorCode: PaperBinderApiVersioning.UnsupportedVersionErrorCode);

            return;
        }

        PaperBinderApiVersioning.SetNegotiatedVersion(context, negotiatedVersion);
        context.Response.OnStarting(static state =>
        {
            var (httpContext, version) = ((HttpContext, string))state;
            httpContext.Response.Headers[PaperBinderHttpHeaders.ApiVersion] = version;
            return Task.CompletedTask;
        }, (context, negotiatedVersion));

        await next(context);
    }
}
