using PaperBinder.Application.Tenancy;

namespace PaperBinder.Infrastructure.Tenancy;

internal sealed class TenantUserRecord
{
    public Guid UserId { get; init; }

    public string Email { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;

    public bool IsOwner { get; init; }

    public TenantUserSummary ToSummary() =>
        new(UserId, Email, TenantRoleParser.Parse(Role), IsOwner);
}
