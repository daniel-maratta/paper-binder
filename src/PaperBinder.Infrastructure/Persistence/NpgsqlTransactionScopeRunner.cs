using System.Data;
using System.Data.Common;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Persistence;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class NpgsqlTransactionScopeRunner(
    ISqlConnectionFactory connectionFactory,
    ILogger<NpgsqlTransactionScopeRunner> logger) : ITransactionScopeRunner
{
    public Task ExecuteAsync(
        Func<DbConnection, DbTransaction, CancellationToken, Task> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default) =>
        ExecuteAsync<object?>(
            async (connection, transaction, innerCancellationToken) =>
            {
                await operation(connection, transaction, innerCancellationToken);
                return null;
            },
            isolationLevel,
            cancellationToken);

    public async Task<T> ExecuteAsync<T>(
        Func<DbConnection, DbTransaction, CancellationToken, Task<T>> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(operation);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(isolationLevel, cancellationToken);

        try
        {
            var result = await operation(connection, transaction, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await RollbackAsync(transaction);
            throw;
        }
    }

    private async Task RollbackAsync(DbTransaction transaction)
    {
        try
        {
            await transaction.RollbackAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            // Preserve the original failure from the transaction body.
            logger.LogWarning(
                ex,
                "Database transaction rollback failed after an earlier operation error. TransactionType={TransactionType} ConnectionType={ConnectionType} ConnectionState={ConnectionState}",
                transaction.GetType().FullName,
                transaction.Connection?.GetType().FullName,
                transaction.Connection?.State);
        }
    }
}
