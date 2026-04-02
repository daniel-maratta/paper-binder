namespace PaperBinder.Api;

internal static class PaperBinderHttpContractExtensions
{
    public static IServiceCollection AddPaperBinderHttpContract(this IServiceCollection services)
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = PaperBinderProblemDetails.Customize;
        });

        return services;
    }

    public static void UsePaperBinderHttpContract(this WebApplication app)
    {
        app.UseMiddleware<RequestCorrelationMiddleware>();
        app.UseExceptionHandler();
        app.UseMiddleware<ApiVersionNegotiationMiddleware>();
    }

    public static void MapPaperBinderApiFallback(this WebApplication app)
    {
        app.Map("/api/{**path}", async (HttpContext context, IProblemDetailsService problemDetailsService) =>
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status404NotFound);
        });
    }
}
