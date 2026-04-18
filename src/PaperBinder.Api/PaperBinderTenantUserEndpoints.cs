using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderTenantUserEndpoints
{
    public static void MapPaperBinderTenantUserEndpoints(this WebApplication app)
    {
        var tenantUsers = app.MapGroup("/api/tenant/users")
            .RequirePaperBinderTenantHost()
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin);

        tenantUsers.MapGet(string.Empty, ListUsersAsync);
        tenantUsers.MapPost(string.Empty, CreateUserAsync);
        tenantUsers.MapPost("/{userId:guid}/role", ChangeRoleAsync);
    }

    private static async Task<ListTenantUsersResponse> ListUsersAsync(
        ITenantUserAdministrationService tenantUserAdministrationService,
        IRequestTenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var users = await tenantUserAdministrationService.ListUsersAsync(tenant.TenantId, cancellationToken);

        return new ListTenantUsersResponse(users.Select(MapUser).ToArray());
    }

    private static async Task CreateUserAsync(
        HttpContext context,
        ITenantUserAdministrationService tenantUserAdministrationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        CreateTenantUserRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryNormalizeEmail(request.Email, out var email))
        {
            await PaperBinderProblemDetails.WriteApiProblemAsync(
                context,
                problemDetailsService,
                StatusCodes.Status400BadRequest,
                "Tenant user email invalid.",
                "The request must include a non-empty email address up to 256 characters long.");
            return;
        }

        var tenant = GetRequiredTenant(tenantContext);
        GetRequiredMembership(membershipContext);
        var outcome = await tenantUserAdministrationService.CreateUserAsync(
            new TenantUserCreateCommand(
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                email,
                request.Password ?? string.Empty,
                request.Role ?? string.Empty),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status201Created;
        await context.Response.WriteAsJsonAsync(MapUser(outcome.User!), cancellationToken);
    }

    private static async Task ChangeRoleAsync(
        HttpContext context,
        Guid userId,
        ITenantUserAdministrationService tenantUserAdministrationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        ChangeTenantUserRoleRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        GetRequiredMembership(membershipContext);
        var outcome = await tenantUserAdministrationService.ChangeRoleAsync(
            new TenantUserRoleChangeCommand(
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                userId,
                request.Role ?? string.Empty),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(MapUser(outcome.User!), cancellationToken);
    }

    private static async Task WriteFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        TenantUserAdministrationFailure failure)
    {
        var problem = PaperBinderTenantUserProblemMapping.Map(failure);
        await PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            problem.StatusCode,
            problem.Title,
            problem.Detail,
            problem.ErrorCode);
    }

    private static TenantContext GetRequiredTenant(IRequestTenantContext tenantContext) =>
        tenantContext.Tenant
        ?? throw new InvalidOperationException("Tenant user endpoints require an established tenant request context.");

    private static TenantMembership GetRequiredMembership(IRequestTenantMembershipContext membershipContext) =>
        membershipContext.Membership
        ?? throw new InvalidOperationException("Tenant user endpoints require an established tenant membership context.");

    private static bool TryNormalizeEmail(string? value, out string normalizedEmail)
    {
        normalizedEmail = value?.Trim() ?? string.Empty;

        if (normalizedEmail.Length is 0 or > 256)
        {
            return false;
        }

        if (normalizedEmail.Any(char.IsWhiteSpace))
        {
            return false;
        }

        var atIndex = normalizedEmail.IndexOf('@');
        return atIndex > 0 &&
               atIndex == normalizedEmail.LastIndexOf('@') &&
               atIndex < normalizedEmail.Length - 1;
    }

    private static TenantUserResponse MapUser(TenantUserSummary user) =>
        new(user.UserId, user.Email, user.Role.ToString(), user.IsOwner);

    internal sealed record CreateTenantUserRequest(
        string? Email,
        string? Password,
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
}
