using PaperBinder.Application.Binders;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Binders;

internal sealed class BinderSummaryRecord
{
    public Guid BinderId { get; init; }

    public string Name { get; init; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; init; }

    public BinderSummary ToSummary() =>
        new(BinderId, Name, CreatedAtUtc);
}

internal sealed class BinderDetailRecord
{
    public Guid BinderId { get; init; }

    public string Name { get; init; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; init; }

    public string Mode { get; init; } = string.Empty;

    public string[] AllowedRoles { get; init; } = [];

    public BinderDetail ToDetail() =>
        new(BinderId, Name, CreatedAtUtc);

    public BinderPolicy ToPolicy() =>
        new(
            BinderPersistenceContractParser.ParseMode(Mode),
            BinderPersistenceContractParser.ParseAllowedRoles(AllowedRoles));
}

internal sealed class BinderPolicyRecord
{
    public string Mode { get; init; } = string.Empty;

    public string[] AllowedRoles { get; init; } = [];

    public BinderPolicy ToPolicy() =>
        new(
            BinderPersistenceContractParser.ParseMode(Mode),
            BinderPersistenceContractParser.ParseAllowedRoles(AllowedRoles));
}

internal static class BinderPersistenceContractParser
{
    public static BinderPolicyMode ParseMode(string value) =>
        BinderPolicyModeNames.TryParseContractValue(value, out var mode)
            ? mode
            : throw new InvalidOperationException($"Unsupported binder policy mode `{value}` in persisted data.");

    public static IReadOnlyList<TenantRole> ParseAllowedRoles(string[] values) =>
        values
            .Select(TenantRoleParser.Parse)
            .OrderBy(role => role)
            .ToArray();
}
