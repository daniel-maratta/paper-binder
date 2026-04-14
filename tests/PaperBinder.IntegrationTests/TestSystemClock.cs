using PaperBinder.Application.Time;

namespace PaperBinder.IntegrationTests;

internal sealed class MutableTestSystemClock(DateTimeOffset utcNow) : ISystemClock
{
    public DateTimeOffset UtcNow { get; private set; } = utcNow;

    public void Set(DateTimeOffset utcNow) => UtcNow = utcNow;

    public void Advance(TimeSpan amount) => UtcNow = UtcNow.Add(amount);
}
