namespace PaperBinder.Api;

internal static class PaperBinderTenancyExtensions
{
    public static IServiceCollection AddPaperBinderTenancy(this IServiceCollection services)
    {
        services.AddScoped<PaperBinderTenantRequestContext>();
        services.AddScoped<IRequestTenantContext>(provider => provider.GetRequiredService<PaperBinderTenantRequestContext>());
        services.AddScoped<IRequestTenantContextSetter>(provider => provider.GetRequiredService<PaperBinderTenantRequestContext>());
        services.AddScoped<PaperBinderResolvedTenantHostContext>();
        services.AddScoped<IRequestResolvedTenantHostContext>(provider => provider.GetRequiredService<PaperBinderResolvedTenantHostContext>());
        services.AddScoped<IRequestResolvedTenantHostContextSetter>(provider => provider.GetRequiredService<PaperBinderResolvedTenantHostContext>());

        return services;
    }

    public static void UsePaperBinderTenancy(this WebApplication app)
    {
        app.UseMiddleware<TenantResolutionMiddleware>();
    }
}
