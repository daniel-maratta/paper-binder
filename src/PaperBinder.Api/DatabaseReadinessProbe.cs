using System.Data.Common;
using PaperBinder.Application.Persistence;

namespace PaperBinder.Api;

internal sealed class DatabaseReadinessProbe(ISqlConnectionFactory connectionFactory)
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
            return result switch
            {
                1 => true,
                1L => true,
                1m => true,
                _ => false
            };
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
