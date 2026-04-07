namespace PaperBinder.Api;

internal enum PaperBinderResolvedEndpointHostKind
{
    System,
    Tenant
}

internal sealed record PaperBinderResolvedEndpointHostMetadata(PaperBinderResolvedEndpointHostKind RequiredHostKind);

internal static class PaperBinderEndpointHostRequirements
{
    public static TBuilder RequirePaperBinderSystemHost<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.Add(endpointBuilder => endpointBuilder.Metadata.Add(
            new PaperBinderResolvedEndpointHostMetadata(PaperBinderResolvedEndpointHostKind.System)));
        return builder;
    }

    public static TBuilder RequirePaperBinderTenantHost<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);
        builder.Add(endpointBuilder => endpointBuilder.Metadata.Add(
            new PaperBinderResolvedEndpointHostMetadata(PaperBinderResolvedEndpointHostKind.Tenant)));
        return builder;
    }
}
