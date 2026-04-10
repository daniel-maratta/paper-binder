using Microsoft.AspNetCore.Mvc;
using PaperBinder.Application.Documents;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderDocumentEndpoints
{
    public static void MapPaperBinderDocumentEndpoints(this WebApplication app)
    {
        var documents = app.MapGroup("/api/documents")
            .RequirePaperBinderTenantHost();

        documents.MapGet(string.Empty, ListDocumentsAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);
        documents.MapGet("/{documentId:guid}", GetDocumentAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);
        documents.MapPost(string.Empty, CreateDocumentAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderWrite);
        documents.MapPost("/{documentId:guid}/archive", ArchiveDocumentAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderWrite);
        documents.MapPost("/{documentId:guid}/unarchive", UnarchiveDocumentAsync)
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderWrite);
    }

    private static async Task ListDocumentsAsync(
        HttpContext context,
        Guid? binderId,
        bool? includeArchived,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var outcome = await documentService.ListAsync(
            new DocumentListQuery(
                tenant,
                membership.Role,
                binderId,
                includeArchived ?? false),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            new ListDocumentsResponse(
                outcome.Documents!
                    .Select(PaperBinderDocumentResponseMapping.MapSummary)
                    .ToArray()),
            cancellationToken);
    }

    private static async Task GetDocumentAsync(
        HttpContext context,
        Guid documentId,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var outcome = await documentService.GetDetailAsync(
            tenant,
            membership.Role,
            documentId,
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            PaperBinderDocumentResponseMapping.MapDetail(outcome.Document!),
            cancellationToken);
    }

    private static async Task CreateDocumentAsync(
        HttpContext context,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CreateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var outcome = await documentService.CreateAsync(
            new DocumentCreateCommand(
                tenant,
                membership.UserId,
                membership.Role,
                request.BinderId,
                request.Title,
                request.ContentType,
                request.Content,
                request.SupersedesDocumentId),
            cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status201Created;
        await context.Response.WriteAsJsonAsync(
            PaperBinderDocumentResponseMapping.MapDetail(outcome.Document!),
            cancellationToken);
    }

    private static async Task ArchiveDocumentAsync(
        HttpContext context,
        Guid documentId,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        await TransitionArchiveStateAsync(
            context,
            documentId,
            documentService,
            tenantContext,
            membershipContext,
            problemDetailsService,
            archiveRequested: true,
            cancellationToken);
    }

    private static async Task UnarchiveDocumentAsync(
        HttpContext context,
        Guid documentId,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        CancellationToken cancellationToken)
    {
        await TransitionArchiveStateAsync(
            context,
            documentId,
            documentService,
            tenantContext,
            membershipContext,
            problemDetailsService,
            archiveRequested: false,
            cancellationToken);
    }

    private static async Task TransitionArchiveStateAsync(
        HttpContext context,
        Guid documentId,
        IDocumentService documentService,
        IRequestTenantContext tenantContext,
        IRequestTenantMembershipContext membershipContext,
        IProblemDetailsService problemDetailsService,
        bool archiveRequested,
        CancellationToken cancellationToken)
    {
        var tenant = GetRequiredTenant(tenantContext);
        var membership = GetRequiredMembership(membershipContext);
        var command = new DocumentArchiveCommand(
            tenant,
            membership.UserId,
            membership.Role,
            documentId);

        var outcome = archiveRequested
            ? await documentService.ArchiveAsync(command, cancellationToken)
            : await documentService.UnarchiveAsync(command, cancellationToken);

        if (!outcome.Succeeded)
        {
            await WriteFailureAsync(context, problemDetailsService, outcome.Failure!);
            return;
        }

        await context.Response.WriteAsJsonAsync(
            PaperBinderDocumentResponseMapping.MapDetail(outcome.Document!),
            cancellationToken);
    }

    private static async Task WriteFailureAsync(
        HttpContext context,
        IProblemDetailsService problemDetailsService,
        DocumentFailure failure)
    {
        var problem = PaperBinderDocumentProblemMapping.Map(failure);
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
        ?? throw new InvalidOperationException("Document endpoints require an established tenant request context.");

    private static TenantMembership GetRequiredMembership(IRequestTenantMembershipContext membershipContext) =>
        membershipContext.Membership
        ?? throw new InvalidOperationException("Document endpoints require an established tenant membership context.");

    internal sealed record CreateDocumentRequest(
        Guid? BinderId,
        string? Title,
        string? ContentType,
        string? Content,
        Guid? SupersedesDocumentId);

    internal sealed record ListDocumentsResponse(
        IReadOnlyList<DocumentSummaryResponse> Documents);
}
