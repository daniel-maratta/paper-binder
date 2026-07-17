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
        tenantUsers.MapDelete("/{userId:guid}", DeleteUserAsync);
    }

    private static async Task<ListTenantUsersResponse> ListUsersAsync(
        ITenantUserAdministrationService tenantUserAdministrationService,
        IRequestTenantContext tenantContext,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var users = await tenantUserAdministrationService.ListUsersAsync(tenant.TenantId, cancellationToken);

        return PaperBinderTenantUserResponseMapping.MapList(users);
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
        if (!PaperBinderTenantUserRequestValidation.TryTrimToValidEmailAddress(request.Email, out var email))
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
        var requestedRole = request.Role?.Trim() ?? string.Empty;
        var outcome = await tenantUserAdministrationService.CreateUserAsync(
            new TenantUserCreateCommand(
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                email,
                requestedRole),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status201Created;
        await context.Response.WriteAsJsonAsync(
            PaperBinderTenantUserResponseMapping.MapCreated(
                outcome.User!,
                outcome.GeneratedPassword
                ?? throw new InvalidOperationException("Created tenant-user responses require a generated password.")),
            cancellationToken);
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
        var requestedRole = request.Role?.Trim() ?? string.Empty;
        var outcome = await tenantUserAdministrationService.ChangeRoleAsync(
            new TenantUserRoleChangeCommand(
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                userId,
                requestedRole),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            PaperBinderTenantUserResponseMapping.MapSummary(outcome.User!),
            cancellationToken);
    }

    private static async Task DeleteUserAsync(
        HttpContext context,
        Guid userId,
        ITenantUserAdministrationService tenantUserAdministrationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        GetRequiredMembership(membershipContext);
        var outcome = await tenantUserAdministrationService.DeleteUserAsync(
            new TenantUserDeleteCommand(
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                userId),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status204NoContent;
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
}
