using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderTenantLeaseEndpoints
{
    public static void MapPaperBinderTenantLeaseEndpoints(this WebApplication app)
    {
        var tenantLease = app.MapGroup(PaperBinderTenantLeaseRoutes.LeasePath)
            .RequirePaperBinderTenantHost();

        tenantLease.MapGet(string.Empty, GetLeaseAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.AuthenticatedUser);

        tenantLease.MapPost("/extend", ExtendLeaseAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin)
            .RequireRateLimiting(PaperBinderPreAuthProtectionExtensions.TenantLeaseExtendPolicyName);
    }

    private static async Task GetLeaseAsync(
        HttpContext context,
        ITenantLeaseService tenantLeaseService,
        IRequestTenantContext tenantContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var outcome = await tenantLeaseService.GetAsync(tenant, cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(MapResponse(outcome.Lease!), cancellationToken);
    }

    private static async Task ExtendLeaseAsync(
        HttpContext context,
        ITenantLeaseService tenantLeaseService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var outcome = await tenantLeaseService.ExtendAsync(
            new TenantLeaseExtendCommand(tenant, membership.UserId),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(MapResponse(outcome.Lease!), cancellationToken);
    }

    private static async Task WriteFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        TenantLeaseFailure failure)
    {
        var problem = PaperBinderTenantLeaseProblemMapping.Map(failure);
        await PaperBinderProblemDetails.WriteApiProblemAsync(
            context,
            problemDetailsService,
            problem.StatusCode,
            problem.Title,
            problem.Detail,
            problem.ErrorCode);
    }

    private static TenantLeaseResponse MapResponse(TenantLeaseState lease) =>
        new(
            lease.ExpiresAtUtc,
            lease.SecondsRemaining,
            lease.ExtensionCount,
            lease.MaxExtensions,
            lease.CanExtend);

    private static TenantContext GetRequiredTenant(IRequestTenantContext tenantContext) =>
        tenantContext.Tenant
        ?? throw new InvalidOperationException("Tenant lease endpoints require an established tenant request context.");

    private static TenantMembership GetRequiredMembership(IRequestTenantMembershipContext membershipContext) =>
        membershipContext.Membership
        ?? throw new InvalidOperationException("Tenant lease extension requires an established tenant membership context.");

    internal sealed record TenantLeaseResponse(
        DateTimeOffset ExpiresAt,
        int SecondsRemaining,
        int ExtensionCount,
        int MaxExtensions,
        bool CanExtend);
}
