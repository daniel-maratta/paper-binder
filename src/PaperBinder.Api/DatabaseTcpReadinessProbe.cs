using System.Net.Sockets;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Api;

internal sealed class DatabaseTcpReadinessProbe(PaperBinderRuntimeSettings runtimeSettings)
{
    private readonly DatabaseSettings _database = runtimeSettings.Database;

    public async Task<bool> IsReadyAsync(CancellationToken cancellationToken)
    {
        using var tcpClient = new TcpClient();

        try
        {
            using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutSource.CancelAfter(TimeSpan.FromSeconds(2));

            await tcpClient.ConnectAsync(_database.Host, _database.Port, timeoutSource.Token);
            return true;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
        catch (SocketException)
        {
            return false;
        }
    }
}
