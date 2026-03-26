using PaperBinder.Application;
using PaperBinder.Domain;

namespace PaperBinder.UnitTests;

public sealed class AssemblyReferenceTests
{
    [Fact]
    public void ApplicationProjectReferencesDomainAssembly()
    {
        Assert.Equal(typeof(DomainAssemblyMarker), ApplicationAssemblyMarker.DomainMarkerType);
    }
}
