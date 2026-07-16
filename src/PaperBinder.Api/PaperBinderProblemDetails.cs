using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace PaperBinder.Api;

internal static class PaperBinderProblemDetails
{
    private const string ErrorCodeItemKey = "PaperBinder.Http.ProblemDetails.ErrorCode";
    private const string ExtensionsItemKey = "PaperBinder.Http.ProblemDetails.Extensions";

    public static async Task WriteApiProblemAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        int statusCode,
        string? title = null,
        string? detail = null,
        string? errorCode = null,
        IReadOnlyDictionary<string, object?>? extensions = null)
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

        if (extensions is not null)
        {
            context.Items[ExtensionsItemKey] = extensions;
        }
        else
        {
            context.Items.Remove(ExtensionsItemKey);
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
            context.Items.Remove(ExtensionsItemKey);
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

        if (context.HttpContext.Items.TryGetValue(ExtensionsItemKey, out var extensions) &&
            extensions is IReadOnlyDictionary<string, object?> extensionValues)
        {
            foreach (var (key, value) in extensionValues)
            {
                if (value is not null)
                {
                    context.ProblemDetails.Extensions[key] = value;
                }
            }
        }
    }
}
