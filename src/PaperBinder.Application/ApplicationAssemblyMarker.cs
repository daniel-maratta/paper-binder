using PaperBinder.Domain;

namespace PaperBinder.Application;

public sealed class ApplicationAssemblyMarker
{
    public static Type DomainMarkerType => typeof(DomainAssemblyMarker);
}
