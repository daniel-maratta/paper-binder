using Dapper;
using Microsoft.Extensions.Logging;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Documents;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;

namespace PaperBinder.Infrastructure.Documents;

public sealed class DapperDocumentService(
    ISqlConnectionFactory connectionFactory,
    ITransactionScopeRunner transactionScopeRunner,
    ISystemClock clock,
    IBinderPolicyEvaluator policyEvaluator,
    ILogger<DapperDocumentService> logger) : IDocumentService
{
    public async Task<DocumentCreateOutcome> CreateAsync(
        DocumentCreateCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Tenant);

        if (command.BinderId is null || command.BinderId == Guid.Empty)
        {
            return DocumentCreateOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.BinderRequired,
                    "The request must include a binder id."));
        }

        if (!DocumentRules.TryNormalizeTitle(command.Title, out var normalizedTitle))
        {
            return DocumentCreateOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.TitleInvalid,
                    "The request must include a document title between 1 and 200 characters after trimming."));
        }

        if (!DocumentRules.HasRequiredContent(command.Content))
        {
            return DocumentCreateOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.ContentRequired,
                    "The request must include non-whitespace markdown content."));
        }

        if (!DocumentRules.IsContentLengthValid(command.Content))
        {
            return DocumentCreateOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.ContentTooLarge,
                    "The request content must be 50,000 characters or fewer."));
        }

        if (!DocumentRules.IsSupportedContentType(command.ContentType))
        {
            return DocumentCreateOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.ContentTypeInvalid,
                    "The request contentType must be `markdown`."));
        }

        var documentId = Guid.NewGuid();
        var createdAtUtc = clock.UtcNow;

        var outcome = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var binderAccess = await GetBinderAccessStateAsync(
                    connection,
                    transaction,
                    command.Tenant,
                    command.CallerRole,
                    command.BinderId.Value,
                    innerCancellationToken);

                if (binderAccess == BinderAccessState.NotFound)
                {
                    return DocumentCreateOutcome.Failed(
                        new DocumentFailure(
                            DocumentFailureKind.BinderNotFound,
                            "The target binder does not exist in the current tenant."));
                }

                if (binderAccess == BinderAccessState.Denied)
                {
                    return DocumentCreateOutcome.Failed(
                        new DocumentFailure(
                            DocumentFailureKind.BinderPolicyDenied,
                            "The current tenant role is not allowed to access the target binder."));
                }

                if (command.SupersedesDocumentId.HasValue)
                {
                    if (command.SupersedesDocumentId.Value == documentId)
                    {
                        return DocumentCreateOutcome.Failed(
                            new DocumentFailure(
                                DocumentFailureKind.SupersedesInvalid,
                                "The supplied supersedes document id must reference a different document in the same binder."));
                    }

                    var supersedesExists = await connection.ExecuteScalarAsync<int?>(
                        new CommandDefinition(
                            """
                            select 1
                            from documents
                            where tenant_id = @TenantId
                              and binder_id = @BinderId
                              and id = @SupersedesDocumentId;
                            """,
                            new
                            {
                                TenantId = command.Tenant.TenantId,
                                BinderId = command.BinderId.Value,
                                SupersedesDocumentId = command.SupersedesDocumentId.Value
                            },
                            transaction,
                            cancellationToken: innerCancellationToken));

                    if (!supersedesExists.HasValue)
                    {
                        return DocumentCreateOutcome.Failed(
                            new DocumentFailure(
                                DocumentFailureKind.SupersedesInvalid,
                                "The supplied supersedes document id must reference an existing document in the same binder."));
                    }
                }

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        insert into documents (
                            id,
                            tenant_id,
                            binder_id,
                            title,
                            content_type,
                            content,
                            supersedes_document_id,
                            created_at_utc,
                            archived_at_utc)
                        values (
                            @DocumentId,
                            @TenantId,
                            @BinderId,
                            @Title,
                            @ContentType,
                            @Content,
                            @SupersedesDocumentId,
                            @CreatedAtUtc,
                            null);
                        """,
                        new
                        {
                            DocumentId = documentId,
                            TenantId = command.Tenant.TenantId,
                            BinderId = command.BinderId.Value,
                            Title = normalizedTitle,
                            ContentType = DocumentRules.MarkdownContentType,
                            Content = command.Content!,
                            command.SupersedesDocumentId,
                            CreatedAtUtc = createdAtUtc
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return DocumentCreateOutcome.Success(
                    new DocumentDetail(
                        documentId,
                        command.BinderId.Value,
                        normalizedTitle,
                        DocumentRules.MarkdownContentType,
                        command.Content!,
                        command.SupersedesDocumentId,
                        createdAtUtc,
                        null));
            },
            cancellationToken: cancellationToken);

        if (outcome.Succeeded)
        {
            logger.LogInformation(
                "Document created. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id} document_id={document_id} supersedes_document_id={supersedes_document_id}",
                "document_created",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.BinderId,
                documentId,
                command.SupersedesDocumentId);
        }
        else
        {
            logger.LogWarning(
                "Document create rejected. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} binder_id={binder_id} failure_kind={failure_kind}",
                "document_create_rejected",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.BinderId,
                outcome.Failure!.Kind);
        }

        return outcome;
    }

    public async Task<DocumentListOutcome> ListAsync(
        DocumentListQuery query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(query.Tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);

        if (query.BinderId.HasValue)
        {
            var binderAccess = await GetBinderAccessStateAsync(
                connection,
                transaction: null,
                query.Tenant,
                query.CallerRole,
                query.BinderId.Value,
                cancellationToken);

            return binderAccess switch
            {
                BinderAccessState.NotFound => DocumentListOutcome.Failed(
                    new DocumentFailure(
                        DocumentFailureKind.BinderNotFound,
                        "The target binder does not exist in the current tenant.")),
                BinderAccessState.Denied => DocumentListOutcome.Failed(
                    new DocumentFailure(
                        DocumentFailureKind.BinderPolicyDenied,
                        "The current tenant role is not allowed to access the target binder.")),
                _ => DocumentListOutcome.Success(
                    await ListForBinderCoreAsync(
                        connection,
                        transaction: null,
                        query.Tenant,
                        query.BinderId.Value,
                        query.IncludeArchived,
                        cancellationToken))
            };
        }

        var records = await connection.QueryAsync<DocumentSummaryRecord>(
            new CommandDefinition(
                """
                select
                    d.id as DocumentId,
                    d.binder_id as BinderId,
                    d.title as Title,
                    d.content_type as ContentType,
                    d.supersedes_document_id as SupersedesDocumentId,
                    d.created_at_utc as CreatedAtUtc,
                    d.archived_at_utc as ArchivedAtUtc
                from documents d
                inner join binder_policies bp
                    on bp.tenant_id = d.tenant_id
                   and bp.binder_id = d.binder_id
                where d.tenant_id = @TenantId
                  and (@IncludeArchived or d.archived_at_utc is null)
                  and (
                        bp.mode = @InheritMode
                        or (
                            bp.mode = @RestrictedRolesMode
                            and bp.allowed_roles @> @AllowedRoles
                        )
                      )
                order by d.created_at_utc, d.id;
                """,
                new
                {
                    TenantId = query.Tenant.TenantId,
                    query.IncludeArchived,
                    InheritMode = BinderPolicyModeNames.Inherit,
                    RestrictedRolesMode = BinderPolicyModeNames.RestrictedRoles,
                    AllowedRoles = new[] { query.CallerRole.ToString() }
                },
                cancellationToken: cancellationToken));

        return DocumentListOutcome.Success(records.Select(MapSummary).ToArray());
    }

    public async Task<IReadOnlyList<DocumentSummary>> ListForBinderAsync(
        TenantContext tenant,
        Guid binderId,
        bool includeArchived,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        return await ListForBinderCoreAsync(
            connection,
            transaction: null,
            tenant,
            binderId,
            includeArchived,
            cancellationToken);
    }

    public async Task<DocumentDetailOutcome> GetDetailAsync(
        TenantContext tenant,
        TenantRole callerRole,
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        await using var connection = await connectionFactory.OpenConnectionAsync(cancellationToken);
        var accessState = await GetDocumentAccessStateAsync(
            connection,
            transaction: null,
            tenant,
            callerRole,
            documentId,
            forUpdate: false,
            cancellationToken);

        if (accessState is null)
        {
            return DocumentDetailOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.NotFound,
                    "The requested document does not exist in the current tenant."));
        }

        if (!accessState.IsAllowed)
        {
            return DocumentDetailOutcome.Failed(
                new DocumentFailure(
                    DocumentFailureKind.BinderPolicyDenied,
                    "The current tenant role is not allowed to access the target binder."));
        }

        var record = await connection.QuerySingleAsync<DocumentDetailRecord>(
            new CommandDefinition(
                """
                select
                    id as DocumentId,
                    binder_id as BinderId,
                    title as Title,
                    content_type as ContentType,
                    content as Content,
                    supersedes_document_id as SupersedesDocumentId,
                    created_at_utc as CreatedAtUtc,
                    archived_at_utc as ArchivedAtUtc
                from documents
                where tenant_id = @TenantId
                  and id = @DocumentId;
                """,
                new
                {
                    TenantId = tenant.TenantId,
                    DocumentId = documentId
                },
                cancellationToken: cancellationToken));

        return DocumentDetailOutcome.Success(record.ToDocumentDetail());
    }

    public Task<DocumentDetailOutcome> ArchiveAsync(
        DocumentArchiveCommand command,
        CancellationToken cancellationToken = default) =>
        TransitionArchiveStateAsync(command, archiveRequested: true, cancellationToken);

    public Task<DocumentDetailOutcome> UnarchiveAsync(
        DocumentArchiveCommand command,
        CancellationToken cancellationToken = default) =>
        TransitionArchiveStateAsync(command, archiveRequested: false, cancellationToken);

    private async Task<DocumentDetailOutcome> TransitionArchiveStateAsync(
        DocumentArchiveCommand command,
        bool archiveRequested,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Tenant);

        var outcome = await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var accessState = await GetDocumentAccessStateAsync(
                    connection,
                    transaction,
                    command.Tenant,
                    command.CallerRole,
                    command.DocumentId,
                    forUpdate: true,
                    innerCancellationToken);

                if (accessState is null)
                {
                    return DocumentDetailOutcome.Failed(
                        new DocumentFailure(
                            DocumentFailureKind.NotFound,
                            "The requested document does not exist in the current tenant."));
                }

                if (!accessState.IsAllowed)
                {
                    return DocumentDetailOutcome.Failed(
                        new DocumentFailure(
                            DocumentFailureKind.BinderPolicyDenied,
                            "The current tenant role is not allowed to access the target binder."));
                }

                var transitionFailure = DocumentRules.ValidateArchiveTransition(accessState.ArchivedAtUtc, archiveRequested);
                if (transitionFailure.HasValue)
                {
                    return DocumentDetailOutcome.Failed(
                        new DocumentFailure(
                            transitionFailure.Value,
                            archiveRequested
                                ? "The document is already archived."
                                : "The document is not archived."));
                }

                var archivedAtUtc = archiveRequested ? clock.UtcNow : (DateTimeOffset?)null;

                var updatedRecord = await connection.QuerySingleAsync<DocumentDetailRecord>(
                    new CommandDefinition(
                        """
                        update documents
                        set archived_at_utc = @ArchivedAtUtc
                        where tenant_id = @TenantId
                          and id = @DocumentId
                        returning
                            id as DocumentId,
                            binder_id as BinderId,
                            title as Title,
                            content_type as ContentType,
                            content as Content,
                            supersedes_document_id as SupersedesDocumentId,
                            created_at_utc as CreatedAtUtc,
                            archived_at_utc as ArchivedAtUtc;
                        """,
                        new
                        {
                            TenantId = command.Tenant.TenantId,
                            DocumentId = command.DocumentId,
                            ArchivedAtUtc = archivedAtUtc
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return DocumentDetailOutcome.Success(updatedRecord.ToDocumentDetail());
            },
            cancellationToken: cancellationToken);

        if (outcome.Succeeded)
        {
            logger.LogInformation(
                "Document archive state changed. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} document_id={document_id} archived_at_utc={archived_at_utc}",
                archiveRequested ? "document_archived" : "document_unarchived",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.DocumentId,
                outcome.Document!.ArchivedAtUtc);
        }
        else
        {
            logger.LogWarning(
                "Document archive transition rejected. event_name={event_name} tenant_id={tenant_id} actor_user_id={actor_user_id} effective_user_id={effective_user_id} is_impersonated={is_impersonated} document_id={document_id} failure_kind={failure_kind}",
                archiveRequested ? "document_archive_rejected" : "document_unarchive_rejected",
                command.Tenant.TenantId,
                command.ActorUserId,
                command.EffectiveUserId,
                command.IsImpersonated,
                command.DocumentId,
                outcome.Failure!.Kind);
        }

        return outcome;
    }

    private async Task<IReadOnlyList<DocumentSummary>> ListForBinderCoreAsync(
        System.Data.Common.DbConnection connection,
        System.Data.Common.DbTransaction? transaction,
        TenantContext tenant,
        Guid binderId,
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var records = await connection.QueryAsync<DocumentSummaryRecord>(
            new CommandDefinition(
                """
                select
                    id as DocumentId,
                    binder_id as BinderId,
                    title as Title,
                    content_type as ContentType,
                    supersedes_document_id as SupersedesDocumentId,
                    created_at_utc as CreatedAtUtc,
                    archived_at_utc as ArchivedAtUtc
                from documents
                where tenant_id = @TenantId
                  and binder_id = @BinderId
                  and (@IncludeArchived or archived_at_utc is null)
                order by created_at_utc, id;
                """,
                new
                {
                    TenantId = tenant.TenantId,
                    BinderId = binderId,
                    IncludeArchived = includeArchived
                },
                transaction,
                cancellationToken: cancellationToken));

        return records.Select(MapSummary).ToArray();
    }

    private async Task<BinderAccessState> GetBinderAccessStateAsync(
        System.Data.Common.DbConnection connection,
        System.Data.Common.DbTransaction? transaction,
        TenantContext tenant,
        TenantRole callerRole,
        Guid binderId,
        CancellationToken cancellationToken)
    {
        var record = await connection.QuerySingleOrDefaultAsync<BinderPolicyRecord>(
            new CommandDefinition(
                """
                select
                    bp.mode as Mode,
                    bp.allowed_roles as AllowedRoles
                from binders b
                inner join binder_policies bp
                    on bp.tenant_id = b.tenant_id
                   and bp.binder_id = b.id
                where b.tenant_id = @TenantId
                  and b.id = @BinderId;
                """,
                new
                {
                    TenantId = tenant.TenantId,
                    BinderId = binderId
                },
                transaction,
                cancellationToken: cancellationToken));

        if (record is null)
        {
            return BinderAccessState.NotFound;
        }

        var policy = record.ToPolicy();
        return policyEvaluator.CanAccess(callerRole, policy)
            ? BinderAccessState.Allowed
            : BinderAccessState.Denied;
    }

    private async Task<DocumentAccessState?> GetDocumentAccessStateAsync(
        System.Data.Common.DbConnection connection,
        System.Data.Common.DbTransaction? transaction,
        TenantContext tenant,
        TenantRole callerRole,
        Guid documentId,
        bool forUpdate,
        CancellationToken cancellationToken)
    {
        var sql = forUpdate
            ? """
              select
                  d.binder_id as BinderId,
                  d.archived_at_utc as ArchivedAtUtc,
                  bp.mode as Mode,
                  bp.allowed_roles as AllowedRoles
              from documents d
              inner join binder_policies bp
                  on bp.tenant_id = d.tenant_id
                 and bp.binder_id = d.binder_id
              where d.tenant_id = @TenantId
                and d.id = @DocumentId
              for update;
              """
            : """
              select
                  d.binder_id as BinderId,
                  d.archived_at_utc as ArchivedAtUtc,
                  bp.mode as Mode,
                  bp.allowed_roles as AllowedRoles
              from documents d
              inner join binder_policies bp
                  on bp.tenant_id = d.tenant_id
                 and bp.binder_id = d.binder_id
              where d.tenant_id = @TenantId
                and d.id = @DocumentId;
              """;

        var record = await connection.QuerySingleOrDefaultAsync<DocumentAccessRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenant.TenantId,
                    DocumentId = documentId
                },
                transaction,
                cancellationToken: cancellationToken));

        if (record is null)
        {
            return null;
        }

        var policy = record.ToPolicy();
        return new DocumentAccessState(
            record.BinderId,
            record.ArchivedAtUtc,
            policyEvaluator.CanAccess(callerRole, policy));
    }

    private static DocumentSummary MapSummary(DocumentSummaryRecord record) =>
        new(
            record.DocumentId,
            record.BinderId,
            record.Title,
            record.ContentType,
            record.SupersedesDocumentId,
            record.CreatedAtUtc,
            record.ArchivedAtUtc);

    private sealed class DocumentSummaryRecord
    {
        public Guid DocumentId { get; init; }
        public Guid BinderId { get; init; }
        public string Title { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
        public Guid? SupersedesDocumentId { get; init; }
        public DateTimeOffset CreatedAtUtc { get; init; }
        public DateTimeOffset? ArchivedAtUtc { get; init; }
    }

    private sealed class DocumentDetailRecord
    {
        public Guid DocumentId { get; init; }
        public Guid BinderId { get; init; }
        public string Title { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
        public string Content { get; init; } = string.Empty;
        public Guid? SupersedesDocumentId { get; init; }
        public DateTimeOffset CreatedAtUtc { get; init; }
        public DateTimeOffset? ArchivedAtUtc { get; init; }

        public DocumentDetail ToDocumentDetail() =>
            new(
                DocumentId,
                BinderId,
                Title,
                ContentType,
                Content,
                SupersedesDocumentId,
                CreatedAtUtc,
                ArchivedAtUtc);
    }

    private sealed class BinderPolicyRecord
    {
        public string Mode { get; init; } = string.Empty;
        public string[] AllowedRoles { get; init; } = [];

        public BinderPolicy ToPolicy() =>
            new(ParseMode(Mode), ParseAllowedRoles(AllowedRoles));
    }

    private sealed class DocumentAccessRecord
    {
        public Guid BinderId { get; init; }
        public DateTimeOffset? ArchivedAtUtc { get; init; }
        public string Mode { get; init; } = string.Empty;
        public string[] AllowedRoles { get; init; } = [];

        public BinderPolicy ToPolicy() =>
            new(ParseMode(Mode), ParseAllowedRoles(AllowedRoles));
    }

    private sealed record DocumentAccessState(
        Guid BinderId,
        DateTimeOffset? ArchivedAtUtc,
        bool IsAllowed);

    private enum BinderAccessState
    {
        Allowed,
        NotFound,
        Denied
    }

    private static BinderPolicyMode ParseMode(string value) =>
        BinderPolicyModeNames.TryParse(value, out var mode)
            ? mode
            : throw new InvalidOperationException($"Unsupported binder policy mode `{value}` in persisted data.");

    private static IReadOnlyList<TenantRole> ParseAllowedRoles(string[] values) =>
        values
            .Select(TenantRoleParser.Parse)
            .OrderBy(role => role)
            .ToArray();
}
