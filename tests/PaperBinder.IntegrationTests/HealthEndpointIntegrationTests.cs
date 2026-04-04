using System.Net;
using System.Net.Http.Json;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class HealthEndpointIntegrationTests
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";

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
        Assert.False(liveResponse.Headers.Contains(ApiVersionHeader));
        Assert.False(readyResponse.Headers.Contains(ApiVersionHeader));

        var livePayload = await liveResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var liveCorrelationId = GetRequiredHeader(liveResponse, CorrelationIdHeader);
        var readyCorrelationId = GetRequiredHeader(readyResponse, CorrelationIdHeader);

        Assert.NotNull(livePayload);
        Assert.NotNull(readyPayload);
        Assert.Equal("alive", livePayload!.Status);
        Assert.Equal("ready", readyPayload!.Status);
        Assert.Matches("^[a-f0-9]{32}$", liveCorrelationId);
        Assert.Matches("^[a-f0-9]{32}$", readyCorrelationId);
        Assert.True(livePayload.Timestamp >= requestedAtUtc);
        Assert.True(readyPayload.Timestamp >= requestedAtUtc);
    }

    [Fact]
    public async Task Should_AllowAnonymousHealthChecks_OnKnownTenantHosts()
    {
        await using var database = await _postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-health-tenant");
        var liveResponse = await SendTenantHostHealthRequestAsync(host, tenant.Slug, "/health/live");
        var readyResponse = await SendTenantHostHealthRequestAsync(host, tenant.Slug, "/health/ready");

        Assert.Equal(HttpStatusCode.OK, liveResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, readyResponse.StatusCode);

        var livePayload = await liveResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.NotNull(livePayload);
        Assert.NotNull(readyPayload);
        Assert.Equal("alive", livePayload!.Status);
        Assert.Equal("ready", readyPayload!.Status);
    }

    private static async Task<HttpResponseMessage> SendTenantHostHealthRequestAsync(
        PaperBinderApplicationHost host,
        string tenantSlug,
        string path)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Host = $"{tenantSlug}.paperbinder.localhost";
        return await host.Client.SendAsync(request);
    }

    private static string GetRequiredHeader(HttpResponseMessage response, string headerName)
    {
        Assert.True(response.Headers.TryGetValues(headerName, out var values));
        return Assert.Single(values);
    }

    private sealed record HealthPayload(
        string Status,
        DateTimeOffset Timestamp);
}
