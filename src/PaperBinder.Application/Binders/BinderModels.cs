using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public sealed record BinderSummary(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAtUtc);

public sealed record BinderDetail(
    Guid BinderId,
    string Name,
    DateTimeOffset CreatedAtUtc);

public sealed record BinderPolicy(
    BinderPolicyMode Mode,
    IReadOnlyList<TenantRole> AllowedRoles);

public enum BinderPolicyMode
{
    Inherit,
    RestrictedRoles
}
