namespace PaperBinder.Api;

internal sealed record PaperBinderApiProblem(
    int StatusCode,
    string Title,
    string Detail,
    string ErrorCode);
