using PaperBinder.Application.Tenancy;

namespace PaperBinder.Application.Binders;

public interface IBinderService
{
    Task<IReadOnlyList<BinderSummary>> ListAsync(
        TenantContext tenant,
        TenantRole callerRole,
        CancellationToken cancellationToken = default);

    Task<BinderCreateOutcome> CreateAsync(
        BinderCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<BinderDetailOutcome> GetDetailAsync(
        TenantContext tenant,
        TenantRole callerRole,
        Guid binderId,
        CancellationToken cancellationToken = default);

    Task<BinderPolicyReadOutcome> GetPolicyAsync(
        TenantContext tenant,
        Guid binderId,
        CancellationToken cancellationToken = default);

    Task<BinderPolicyUpdateOutcome> UpdatePolicyAsync(
        BinderPolicyUpdateCommand command,
        CancellationToken cancellationToken = default);
}
