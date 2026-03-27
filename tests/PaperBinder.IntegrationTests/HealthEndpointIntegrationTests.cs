using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace PaperBinder.IntegrationTests;

public sealed class HealthEndpointIntegrationTests
{
    [Fact]
    public async Task Should_ReturnHealthyResponses_When_RuntimeAndDatabaseSocketAreAvailable()
    {
        using var databaseListener = new TcpListener(IPAddress.Loopback, 0);
        databaseListener.Start();

        var databasePort = ((IPEndPoint)databaseListener.LocalEndpoint).Port;
        var configuration = TestRuntimeConfiguration.Create(
            $"Host=127.0.0.1;Port={databasePort};Database=paperbinder;Username=paperbinder;Password=test-password");

        await using var app = await StartApplicationAsync(configuration);
        using var client = CreateClient(app);

        var liveResponse = await client.GetAsync("/health/live");
        var readyResponse = await client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, liveResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, readyResponse.StatusCode);

        var livePayload = await liveResponse.Content.ReadFromJsonAsync<HealthPayload>();
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.NotNull(livePayload);
        Assert.NotNull(readyPayload);
        Assert.Equal("alive", livePayload!.Status);
        Assert.Equal("ready", readyPayload!.Status);
    }

    [Fact]
    public async Task Should_ReturnServiceUnavailable_When_DatabaseSocketIsUnavailable()
    {
        var unavailablePort = GetUnusedPort();
        var configuration = TestRuntimeConfiguration.Create(
            $"Host=127.0.0.1;Port={unavailablePort};Database=paperbinder;Username=paperbinder;Password=test-password");

        await using var app = await StartApplicationAsync(configuration);
        using var client = CreateClient(app);

        var readyResponse = await client.GetAsync("/health/ready");
        var readyPayload = await readyResponse.Content.ReadFromJsonAsync<HealthPayload>();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, readyResponse.StatusCode);
        Assert.NotNull(readyPayload);
        Assert.Equal("not_ready", readyPayload!.Status);
    }

    private static async Task<WebApplication> StartApplicationAsync(
        IReadOnlyDictionary<string, string?> configuration)
    {
        var app = Program.BuildApp(Array.Empty<string>(), Environments.Development, configuration);
        app.Urls.Add("http://127.0.0.1:0");

        await app.StartAsync();
        return app;
    }

    private static HttpClient CreateClient(WebApplication app)
    {
        var server = app.Services.GetRequiredService<IServer>();
        var addresses = server.Features.Get<IServerAddressesFeature>();
        var address = Assert.Single(addresses!.Addresses);

        return new HttpClient
        {
            BaseAddress = new Uri(address)
        };
    }

    private static int GetUnusedPort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();

        return ((IPEndPoint)listener.LocalEndpoint).Port;
    }

    private sealed record HealthPayload(
        string Status,
        DateTimeOffset Timestamp);
}
