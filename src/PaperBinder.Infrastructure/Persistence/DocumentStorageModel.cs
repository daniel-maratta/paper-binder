namespace PaperBinder.Infrastructure.Persistence;

internal sealed class DocumentStorageModel
{
    public Guid Id { get; set; }

    public Guid TenantId { get; set; }

    public Guid BinderId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public Guid? SupersedesDocumentId { get; set; }

    public DateTimeOffset CreatedAtUtc { get; set; }

    public DateTimeOffset? ArchivedAtUtc { get; set; }
}
