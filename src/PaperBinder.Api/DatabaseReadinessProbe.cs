using System.Data.Common;
using PaperBinder.Application.Persistence;

namespace PaperBinder.Api;

internal sealed class DatabaseReadinessProbe(ISqlConnectionFactory connectionFactory) : IDatabaseReadinessProbe
{
    public async Task<bool> IsReadyAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "select 1";
            command.CommandTimeout = 2;

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is int scalar && scalar == 1;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
        catch (DbException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
        catch (TimeoutException)
        {
            return false;
        }
    }
}
