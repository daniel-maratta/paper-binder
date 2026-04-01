using System.Data;
using System.Data.Common;

namespace PaperBinder.Application.Persistence;

public interface ITransactionScopeRunner
{
    Task ExecuteAsync(
        Func<DbConnection, DbTransaction, CancellationToken, Task> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default);

    Task<T> ExecuteAsync<T>(
        Func<DbConnection, DbTransaction, CancellationToken, Task<T>> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted,
        CancellationToken cancellationToken = default);
}
