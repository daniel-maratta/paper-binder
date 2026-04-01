using PaperBinder.Application.Time;

namespace PaperBinder.Worker;

public sealed class Worker(ILogger<Worker> logger, ISystemClock clock) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("PaperBinder.Worker heartbeat at {TimeUtc}.", clock.UtcNow);
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
