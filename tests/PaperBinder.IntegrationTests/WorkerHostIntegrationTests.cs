using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Application.Tenancy;
using PaperBinder.Worker;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class WorkerHostIntegrationTests
{
    [Fact]
    public void Should_BuildWorkerHost_AndResolveCleanupDependencies_When_RuntimeConfigurationIsValid()
    {
        var configuration = TestRuntimeConfiguration.Create(
            "Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password");

        using var host = PaperBinderWorkerHostBuilder.BuildHost(
            Array.Empty<string>(),
            Environments.Development,
            configuration);
        using var scope = host.Services.CreateScope();

        Assert.NotNull(host.Services.GetService(typeof(IHostApplicationLifetime)));
        Assert.NotNull(scope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>());
        Assert.Single(host.Services.GetServices<IHostedService>().OfType<PaperBinder.Worker.Worker>());
    }
}
