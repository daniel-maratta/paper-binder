namespace PaperBinder.Application.Time;

public interface ISystemClock
{
    DateTimeOffset UtcNow { get; }
}
