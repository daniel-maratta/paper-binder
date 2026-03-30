namespace PaperBinder.Api;

internal interface IDatabaseReadinessProbe
{
    Task<bool> IsReadyAsync(CancellationToken cancellationToken);
}
