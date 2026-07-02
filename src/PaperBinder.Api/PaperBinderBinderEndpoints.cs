using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Documents;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderBinderEndpoints
{
    public static void MapPaperBinderBinderEndpoints(this WebApplication app)
    {
        var binders = app.MapGroup("/api/binders")
            .RequirePaperBinderTenantHost();

        binders.MapGet(string.Empty, ListBindersAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);
        binders.MapPost(string.Empty, CreateBinderAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderWrite);
        binders.MapGet("/{binderId:guid}", GetBinderAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);
        binders.MapGet("/{binderId:guid}/policy", GetBinderPolicyAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin);
        binders.MapPut("/{binderId:guid}/policy", UpdateBinderPolicyAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin);
    }

    private static async Task<ListBindersResponse> ListBindersAsync(
        IBinderService binderService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var binders = await binderService.ListAsync(tenant, membership.Role, cancellationToken);

        return PaperBinderBinderResponseMapping.MapList(binders);
    }

    private static async Task CreateBinderAsync(
        HttpContext context,
        IBinderService binderService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        CreateBinderRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        GetRequiredMembership(membershipContext);
        var outcome = await binderService.CreateAsync(
            new BinderCreateCommand(
                tenant,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                request.Name),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status201Created;
        await context.Response.WriteAsJsonAsync(
            PaperBinderBinderResponseMapping.MapSummary(outcome.Binder!),
            cancellationToken);
    }

    private static async Task GetBinderAsync(
        HttpContext context,
        Guid binderId,
        IBinderService binderService,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var outcome = await binderService.GetDetailAsync(
            tenant,
            membership.Role,
            binderId,
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        var documents = await documentService.ListForBinderAsync(
            tenant,
            binderId,
            includeArchived: false,
            cancellationToken);

        await context.Response.WriteAsJsonAsync(
            PaperBinderBinderResponseMapping.MapDetail(outcome.Binder!, documents),
            cancellationToken);
    }

    private static async Task GetBinderPolicyAsync(
        HttpContext context,
        Guid binderId,
        IBinderService binderService,
        IRequestTenantContext tenantContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var outcome = await binderService.GetPolicyAsync(tenant, binderId, cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            PaperBinderBinderResponseMapping.MapPolicy(outcome.Policy!),
            cancellationToken);
    }

    private static async Task UpdateBinderPolicyAsync(
        HttpContext context,
        Guid binderId,
        IBinderService binderService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IRequestExecutionUserContext executionUserContext,
        IProblemDetailsService problemDetailsService,
        UpdateBinderPolicyRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        GetRequiredMembership(membershipContext);
        var outcome = await binderService.UpdatePolicyAsync(
            new BinderPolicyUpdateCommand(
                tenant,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                executionUserContext.IsImpersonated,
                binderId,
                request.Mode,
                request.AllowedRoles),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            PaperBinderBinderResponseMapping.MapPolicy(outcome.Policy!),
            cancellationToken);
    }

    private static async Task WriteFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        BinderFailure failure)
    {
        var problem = PaperBinderBinderProblemMapping.Map(failure);
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
        ?? throw new InvalidOperationException("Binder endpoints require an established tenant request context.");

    private static TenantMembership GetRequiredMembership(IRequestTenantMembershipContext membershipContext) =>
        membershipContext.Membership
        ?? throw new InvalidOperationException("Binder endpoints require an established tenant membership context.");
}
