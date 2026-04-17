using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderImpersonationEndpoints
{
    public static void MapPaperBinderImpersonationEndpoints(this WebApplication app)
    {
        var impersonation = app.MapGroup("/api/tenant/impersonation")
            .RequirePaperBinderTenantHost()
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.AuthenticatedUser);

        impersonation.MapGet(string.Empty, GetStatusAsync);
        impersonation.MapPost(string.Empty, StartAsync);
        impersonation.MapDelete(string.Empty, StopAsync);
    }

    private static async Task<TenantImpersonationStatusResponse> GetStatusAsync(
        IPaperBinderImpersonationService impersonationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);

        return await impersonationService.GetStatusAsync(
            tenant,
            executionUserContext,
            membership,
            cancellationToken);
    }

    private static async Task StartAsync(
        HttpContext context,
        IPaperBinderImpersonationService impersonationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        StartTenantImpersonationRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);

        var outcome = await impersonationService.StartAsync(
            context,
            tenant,
            membership,
            executionUserContext,
            request.UserId,
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(outcome.Status!, cancellationToken);
    }

    private static async Task StopAsync(
        HttpContext context,
        IPaperBinderImpersonationService impersonationService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);

        var outcome = await impersonationService.StopAsync(
            context,
            tenant,
            membership,
            executionUserContext,
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(outcome.Status!, cancellationToken);
    }

    private static async Task WriteFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        TenantImpersonationFailure failure)
    {
        var problem = PaperBinderImpersonationProblemMapping.Map(failure);
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
        ?? throw new InvalidOperationException("Tenant impersonation endpoints require an established tenant request context.");

    private static TenantMembership GetRequiredMembership(IRequestTenantMembershipContext membershipContext) =>
        membershipContext.Membership
        ?? throw new InvalidOperationException("Tenant impersonation endpoints require an established tenant membership context.");

    internal sealed record StartTenantImpersonationRequest(
        Guid UserId);
}
