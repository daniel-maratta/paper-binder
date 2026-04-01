using System.Net;
using System.Net.Http.Json;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class HealthEndpointIntegrationTests
{
    private readonly PostgresContainerFixture _postgres;

    public HealthEndpointIntegrationTests(PostgresContainerFixture postgres)
    {
        _postgres = postgres;
    }

    [Fact]
    public async Task Should_ReturnHealthyResponses_When_RuntimeAndDatabaseQueriesAreAvailable()
    {
        await using var database = await _postgres.CreateDatabaseAsync();
        await using var host = await PaperBinderApplicationHost.StartAsync(database.ConnectionString);

        var requestedAtUtc = DateTimeOffset.UtcNow;

        var liveResponse = await host.Client.GetAsync("/health/live");
        var readyResponse = await host.Client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, liveResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, readyResponse.StatusCode);

        var livePayload = await liveResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.NotNull(livePayload);
        Assert.NotNull(readyPayload);
        Assert.Equal("alive", livePayload!.Status);
        Assert.Equal("ready", readyPayload!.Status);
        Assert.True(livePayload.Timestamp >= requestedAtUtc);
        Assert.True(readyPayload.Timestamp >= requestedAtUtc);
    }

    private sealed record HealthPayload(
        string Status,
        DateTimeOffset Timestamp);
}
