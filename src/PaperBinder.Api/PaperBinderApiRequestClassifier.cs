namespace PaperBinder.Api;

internal static class PaperBinderApiRequestClassifier
{
    private static readonly PathString ApiRoot = new("/api");

    public static bool IsApiRequest(PathString path) =>
        path.StartsWithSegments(ApiRoot, out _);
}
