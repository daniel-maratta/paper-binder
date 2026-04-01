using System.Data.Common;

namespace PaperBinder.Application.Persistence;

public interface ISqlConnectionFactory
{
    ValueTask<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken = default);
}
