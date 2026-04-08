namespace PaperBinder.Infrastructure.Persistence;

internal sealed class BinderStorageModel
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAtUtc { get; set; }
}
