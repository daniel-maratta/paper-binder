namespace PaperBinder.Infrastructure.Persistence;

internal sealed class BinderPolicyStorageModel
{
    public Guid TenantId { get; set; }

    public Guid BinderId { get; set; }

    public string Mode { get; set; } = string.Empty;

    public string[] AllowedRoles { get; set; } = [];

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset UpdatedAtUtc { get; set; }
}
