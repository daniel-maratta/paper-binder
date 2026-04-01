using System.Data.Common;
using Npgsql;
using PaperBinder.Application.Persistence;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class NpgsqlSqlConnectionFactory(NpgsqlDataSource dataSource) : ISqlConnectionFactory
{
    public async ValueTask<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken = default) =>
        await dataSource.OpenConnectionAsync(cancellationToken);
}
