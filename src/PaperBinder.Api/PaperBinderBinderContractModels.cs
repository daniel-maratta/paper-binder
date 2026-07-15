using PaperBinder.Application.Binders;
using PaperBinder.Application.Documents;

namespace PaperBinder.Api;

internal sealed record CreateBinderRequest(
    string? Name);

internal sealed record UpdateBinderRequest(
    string? Name);

internal sealed record UpdateBinderPolicyRequest(
    string? Mode,
    IReadOnlyList<string>? AllowedRoles);

internal sealed record ListBindersResponse(
    IReadOnlyList<BinderSummaryResponse> Binders);

internal sealed record BinderSummaryResponse(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAt);

internal sealed record BinderDetailResponse(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAt,
    IReadOnlyList<DocumentSummaryResponse> Documents);

internal sealed record BinderPolicyResponse(
    string Mode,
    IReadOnlyList<string> AllowedRoles);

internal static class PaperBinderBinderResponseMapping
{
    public static ListBindersResponse MapList(IReadOnlyList<BinderSummary> binders) =>
        new(binders.Select(MapSummary).ToArray());

    public static BinderSummaryResponse MapSummary(BinderSummary binder) =>
        new(binder.BinderId, binder.Name, binder.CreatedAtUtc);

    public static BinderDetailResponse MapDetail(
        BinderDetail binder,
        IReadOnlyList<DocumentSummary> documents) =>
        new(
            binder.BinderId,
            binder.Name,
            binder.CreatedAtUtc,
            documents
                .Select(PaperBinderDocumentResponseMapping.MapSummary)
                .ToArray());

    public static BinderPolicyResponse MapPolicy(BinderPolicy policy) =>
        new(
            BinderPolicyModeNames.ToContractValue(policy.Mode),
            policy.AllowedRoles.Select(role => role.ToString()).ToArray());
}
