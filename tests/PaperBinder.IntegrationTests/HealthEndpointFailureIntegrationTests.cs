using System.Net;
using System.Net.Http.Json;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class HealthEndpointFailureIntegrationTests
{
    [Fact]
    public async Task Should_ReturnServiceUnavailable_When_DatabaseQueryFails()
    {
        var unavailablePort = GetUnusedPort();
        var configuration = TestRuntimeConfiguration.Create(
            $"Host=127.0.0.1;Port={unavailablePort};Database=paperbinder;Username=paperbinder;Password=test-password");

        await using var host = await PaperBinderApplicationHost.StartAsync(configuration);

        var readyResponse = await host.Client.GetAsync("/health/ready");
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, readyResponse.StatusCode);
        Assert.NotNull(readyPayload);
        Assert.Equal("not_ready", readyPayload!.Status);
    }

    private static int GetUnusedPort()
    {
        using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();

        return ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
    }

    private sealed record HealthPayload(
        string Status,
        DateTimeOffset Timestamp);
}
