namespace PaperBinder.Infrastructure.Persistence;

internal sealed class UserStorageModel
{
    public Guid Id { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string NormalizedUserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string NormalizedEmail { get; set; } = string.Empty;

    public bool EmailConfirmed { get; set; }

    public string PasswordHash { get; set; } = string.Empty;

    public string SecurityStamp { get; set; } = string.Empty;
}
