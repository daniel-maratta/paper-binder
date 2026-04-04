namespace PaperBinder.Api;

internal static class PaperBinderTenancyExtensions
{
    public static IServiceCollection AddPaperBinderTenancy(this IServiceCollection services)
    {
        services.AddScoped<PaperBinderTenantRequestContext>();
        services.AddScoped<IRequestTenantContext>(provider => provider.GetRequiredService<PaperBinderTenantRequestContext>());
        services.AddScoped<IRequestTenantContextSetter>(provider => provider.GetRequiredService<PaperBinderTenantRequestContext>());

        return services;
    }

    public static void UsePaperBinderTenancy(this WebApplication app)
    {
        app.UseMiddleware<TenantResolutionMiddleware>();
    }
}
