using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Time;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Tenancy;
using PaperBinder.Infrastructure.Time;

namespace PaperBinder.Infrastructure.Persistence;

public static class PaperBinderPersistenceServiceCollectionExtensions
{
    public static IServiceCollection AddPaperBinderPersistence(
        this IServiceCollection services,
        PaperBinderRuntimeSettings runtimeSettings)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(runtimeSettings);

        services.AddSingleton(_ =>
        {
            var dataSourceBuilder = new NpgsqlDataSourceBuilder(runtimeSettings.Database.ConnectionString);
            return dataSourceBuilder.Build();
        });
        services.AddSingleton<ISqlConnectionFactory, NpgsqlSqlConnectionFactory>();
        services.AddSingleton<ITransactionScopeRunner, NpgsqlTransactionScopeRunner>();
        services.AddScoped<ITenantLookupService, DapperTenantLookupService>();
        services.AddSingleton<ISystemClock, UtcSystemClock>();
        services.AddSingleton<PaperBinderDatabaseMigrator>();

        return services;
    }
}
