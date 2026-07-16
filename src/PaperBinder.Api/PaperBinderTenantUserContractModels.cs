using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal sealed record CreateTenantUserRequest(
    string? Email,
    string? Role);

internal sealed record ChangeTenantUserRoleRequest(
    string? Role);

internal sealed record ListTenantUsersResponse(
    IReadOnlyList<TenantUserResponse> Users);

internal sealed record TenantUserResponse(
    Guid UserId,
    string Email,
    string Role,
    bool IsOwner);

internal sealed record TenantUserCredentialsResponse(
    string Email,
    string Password);

internal sealed record CreatedTenantUserResponse(
    Guid UserId,
    string Email,
    string Role,
    bool IsOwner,
    TenantUserCredentialsResponse Credentials);

internal static class PaperBinderTenantUserResponseMapping
{
    public static ListTenantUsersResponse MapList(IReadOnlyList<TenantUserSummary> users) =>
        new(users.Select(MapSummary).ToArray());

    public static TenantUserResponse MapSummary(TenantUserSummary user) =>
        new(user.UserId, user.Email, user.Role.ToString(), user.IsOwner);

    public static CreatedTenantUserResponse MapCreated(
        TenantUserSummary user,
        string generatedPassword) =>
        new(
            user.UserId,
            user.Email,
            user.Role.ToString(),
            user.IsOwner,
            new TenantUserCredentialsResponse(user.Email, generatedPassword));
}
