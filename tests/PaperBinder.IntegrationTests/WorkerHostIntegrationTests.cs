using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Persistence;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class WorkerHostIntegrationTests
{
    [Fact]
    public void Should_BuildWorkerHost_When_RuntimeConfigurationIsValid()
    {
        var settings = new HostApplicationBuilderSettings
        {
            EnvironmentName = Environments.Development
        };

        var builder = Host.CreateApplicationBuilder(settings);
        var configuration = TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password");

        builder.Configuration.AddInMemoryCollection(configuration);

        var runtimeSettings = PaperBinderRuntimeSettings.Load(key => builder.Configuration[key]);

        builder.Services.AddSingleton(runtimeSettings);
        builder.Services.AddPaperBinderPersistence(runtimeSettings);

        using var host = builder.Build();

        Assert.NotNull(host.Services.GetService(typeof(IHostApplicationLifetime)));
    }
}
