using System.Net.Http.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PaperBinder.Api;

namespace PaperBinder.IntegrationTests;

internal sealed class PaperBinderApplicationHost : IAsyncDisposable
{
    private PaperBinderApplicationHost(WebApplication application, HttpClient client)
    {
        Application = application;
        Client = client;
    }

    public WebApplication Application { get; }

    public HttpClient Client { get; }

    public static Task<PaperBinderApplicationHost> StartAsync(string databaseConnection) =>
        StartAsync(TestRuntimeConfiguration.Create(databaseConnection));

    public static async Task<PaperBinderApplicationHost> StartAsync(
        IReadOnlyDictionary<string, string?> configuration)
    {
        var app = Program.BuildApp(Array.Empty<string>(), Environments.Development, configuration);
        app.Urls.Add("http://127.0.0.1:0");

        await app.StartAsync();

        var server = app.Services.GetRequiredService<IServer>();
        var addresses = server.Features.Get<IServerAddressesFeature>();
        var address = Assert.Single(addresses!.Addresses);

        var client = new HttpClient
        {
            BaseAddress = new Uri(address)
        };

        return new PaperBinderApplicationHost(app, client);
    }

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        await Application.DisposeAsync();
    }
}
