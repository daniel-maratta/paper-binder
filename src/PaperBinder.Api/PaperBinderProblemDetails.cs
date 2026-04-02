using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace PaperBinder.Api;

internal static class PaperBinderProblemDetails
{
    private const string ErrorCodeItemKey = "PaperBinder.Http.ProblemDetails.ErrorCode";

    public static async Task WriteApiProblemAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        int statusCode,
        string? title = null,
        string? detail = null,
        string? errorCode = null)
    {
        context.Response.StatusCode = statusCode;

        if (errorCode is not null)
        {
            context.Items[ErrorCodeItemKey] = errorCode;
        }
        else
        {
            context.Items.Remove(ErrorCodeItemKey);
        }

        try
        {
            await problemDetailsService.WriteAsync(new ProblemDetailsContext
            {
                HttpContext = context,
                ProblemDetails = new ProblemDetails
                {
                    Status = statusCode,
                    Title = title,
                    Detail = detail
                }
            });
        }
        finally
        {
            context.Items.Remove(ErrorCodeItemKey);
        }
    }

    public static void Customize(ProblemDetailsContext context)
    {
        if (!PaperBinderApiRequestClassifier.IsApiRequest(context.HttpContext.Request.Path))
        {
            return;
        }

        context.ProblemDetails.Status ??= context.HttpContext.Response.StatusCode;
        context.ProblemDetails.Instance ??= context.HttpContext.Request.Path;
        context.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;

        if (PaperBinderRequestCorrelation.Get(context.HttpContext) is { Length: > 0 } correlationId)
        {
            context.ProblemDetails.Extensions["correlationId"] = correlationId;
        }

        if (context.HttpContext.Items.TryGetValue(ErrorCodeItemKey, out var errorCode) &&
            errorCode is string errorCodeValue)
        {
            context.ProblemDetails.Extensions["errorCode"] = errorCodeValue;
        }
    }
}
