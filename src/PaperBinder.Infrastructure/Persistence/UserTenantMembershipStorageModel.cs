namespace PaperBinder.Infrastructure.Persistence;

internal sealed class UserTenantMembershipStorageModel
{
    public Guid UserId { get; set; }

    public Guid TenantId { get; set; }

    public string Role { get; set; } = string.Empty;

    public bool IsOwner { get; set; }
}
