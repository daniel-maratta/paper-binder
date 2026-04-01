using PaperBinder.Application.Time;

namespace PaperBinder.Infrastructure.Time;

public sealed class UtcSystemClock : ISystemClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
