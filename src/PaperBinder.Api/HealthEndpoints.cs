namespace PaperBinder.Api;

internal static class HealthEndpoints
{
    public static void MapPaperBinderHealthEndpoints(this WebApplication app)
    {
        app.MapGet("/health/live", () =>
            Results.Json(HealthStatusResponse.Create("alive")));

        app.MapGet("/health/ready", async (
            DatabaseTcpReadinessProbe readinessProbe,
            CancellationToken cancellationToken) =>
        {
            var isReady = await readinessProbe.IsReadyAsync(cancellationToken);
            var response = HealthStatusResponse.Create(isReady ? "ready" : "not_ready");

            return isReady
                ? Results.Json(response)
                : Results.Json(response, statusCode: StatusCodes.Status503ServiceUnavailable);
        });
    }

    private sealed record HealthStatusResponse(
        string Status,
        DateTimeOffset Timestamp)
    {
        public static HealthStatusResponse Create(string status) =>
            new(status, DateTimeOffset.UtcNow);
    }
}
