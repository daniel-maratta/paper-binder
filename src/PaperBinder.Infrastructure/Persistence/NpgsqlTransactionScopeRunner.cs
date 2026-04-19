using System.Diagnostics;
using System.Data;
using System.Data.Common;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Persistence;
using PaperBinder.Infrastructure.Diagnostics;

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
        using var activity = PaperBinderTelemetry.StartActivity(
            PaperBinderTelemetry.ActivityNames.DatabaseTransaction,
            ActivityKind.Client);
        activity?.SetTag("db.system", "postgresql");
        activity?.SetTag("db.operation", "transaction");

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(isolationLevel, cancellationToken);

        try
        {
            var result = await operation(connection, transaction, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return result;
        }
        catch (Exception ex)
        {
            await RollbackAsync(transaction);
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
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
