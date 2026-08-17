using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Documents;

public sealed record DocumentListQuery(
    TenantContext Tenant,
    TenantRole CallerRole,
    Guid? BinderId,
    bool IncludeArchived);

public sealed record DocumentCreateCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    TenantRole CallerRole,
    Guid? BinderId,
    string? Title,
    string? ContentType,
    string? Content,
    Guid? SupersedesDocumentId);

public sealed record DocumentArchiveCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    TenantRole CallerRole,
    Guid DocumentId);

public sealed record DocumentDeleteCommand(
    TenantContext Tenant,
    Guid ActorUserId,
    Guid EffectiveUserId,
    bool IsImpersonated,
    TenantRole CallerRole,
    Guid DocumentId);
