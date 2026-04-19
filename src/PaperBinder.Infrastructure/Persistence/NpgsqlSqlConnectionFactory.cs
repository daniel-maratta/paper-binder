using System.Diagnostics;
using System.Data.Common;
using Npgsql;
using PaperBinder.Application.Persistence;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class NpgsqlSqlConnectionFactory(
    NpgsqlDataSource dataSource,
    PaperBinderRuntimeSettings runtimeSettings) : ISqlConnectionFactory
{
    public async ValueTask<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        using var activity = PaperBinderTelemetry.StartActivity(
            PaperBinderTelemetry.ActivityNames.DatabaseConnectionOpen,
            ActivityKind.Client);
        activity?.SetTag("db.system", "postgresql");
        activity?.SetTag("server.address", runtimeSettings.Database.Host);
        activity?.SetTag("server.port", runtimeSettings.Database.Port);

        try
        {
            var connection = await dataSource.OpenConnectionAsync(cancellationToken);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return connection;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            throw;
        }
    }
}
