using PaperBinder.Api;
using PaperBinder.Infrastructure;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class SolutionBootstrapTests
{
    [Fact]
    public void ApiAndInfrastructureAssembliesAreLoadable()
    {
        Assert.Equal("PaperBinder.Api", typeof(Program).Assembly.GetName().Name);
        Assert.Equal("PaperBinder.Infrastructure", typeof(InfrastructureAssemblyMarker).Assembly.GetName().Name);
    }
}
