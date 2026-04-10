using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Documents;

public interface IDocumentService
{
    Task<DocumentCreateOutcome> CreateAsync(
        DocumentCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<DocumentListOutcome> ListAsync(
        DocumentListQuery query,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DocumentSummary>> ListForBinderAsync(
        TenantContext tenant,
        Guid binderId,
        bool includeArchived,
        CancellationToken cancellationToken = default);

    Task<DocumentDetailOutcome> GetDetailAsync(
        TenantContext tenant,
        TenantRole callerRole,
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentDetailOutcome> ArchiveAsync(
        DocumentArchiveCommand command,
        CancellationToken cancellationToken = default);

    Task<DocumentDetailOutcome> UnarchiveAsync(
        DocumentArchiveCommand command,
        CancellationToken cancellationToken = default);
}
