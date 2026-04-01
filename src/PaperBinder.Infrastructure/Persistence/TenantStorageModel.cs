namespace PaperBinder.Infrastructure.Persistence;

internal sealed class TenantStorageModel
{
    public Guid Id { get; set; }

    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset ExpiresAtUtc { get; set; }

    public int LeaseExtensionCount { get; set; }
}
