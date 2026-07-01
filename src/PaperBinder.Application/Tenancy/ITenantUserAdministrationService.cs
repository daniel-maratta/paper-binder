namespace PaperBinder.Application.Tenancy;

public interface ITenantUserAdministrationService
{
    Task<IReadOnlyList<TenantUserSummary>> ListUsersAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<TenantUserCreateOutcome> CreateUserAsync(
        TenantUserCreateCommand command,
        CancellationToken cancellationToken = default);

    Task<TenantUserRoleChangeOutcome> ChangeRoleAsync(
        TenantUserRoleChangeCommand command,
        CancellationToken cancellationToken = default);
}
