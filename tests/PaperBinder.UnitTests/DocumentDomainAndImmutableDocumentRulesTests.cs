using Microsoft.AspNetCore.Http;
using PaperBinder.Api;
using PaperBinder.Application.Documents;

namespace PaperBinder.UnitTests;

public sealed class DocumentDomainAndImmutableDocumentRulesTests
{
    [Fact]
    public void DocumentRules_Should_TrimWhitespace_ForValidTitle()
    {
        var result = DocumentRules.TryNormalizeTitle("  Executive Handbook  ", out var normalizedTitle);

        Assert.True(result);
        Assert.Equal("Executive Handbook", normalizedTitle);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void DocumentRules_Should_RejectBlankTitles(string? input)
    {
        var result = DocumentRules.TryNormalizeTitle(input, out _);

        Assert.False(result);
    }

    [Fact]
    public void DocumentRules_Should_RejectOverlengthTitles()
    {
        var title = new string('a', DocumentRules.MaxTitleLength + 1);

        var result = DocumentRules.TryNormalizeTitle(title, out _);

        Assert.False(result);
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("# Policy", true)]
    public void DocumentRules_Should_RequireNonWhitespaceContent(string? content, bool expectedResult)
    {
        var result = DocumentRules.HasRequiredContent(content);

        Assert.Equal(expectedResult, result);
    }

    [Fact]
    public void DocumentRules_Should_RejectContentOverLength()
    {
        var content = new string('a', DocumentRules.MaxContentLength + 1);

        var result = DocumentRules.IsContentLengthValid(content);

        Assert.False(result);
    }

    [Theory]
    [InlineData("markdown", true)]
    [InlineData("Markdown", false)]
    [InlineData("html", false)]
    [InlineData(null, false)]
    public void DocumentRules_Should_RequireExactMarkdownContentType(string? contentType, bool expectedResult)
    {
        var result = DocumentRules.IsSupportedContentType(contentType);

        Assert.Equal(expectedResult, result);
    }

    [Theory]
    [InlineData(null, true, null)]
    [InlineData("2026-04-09T12:00:00Z", true, DocumentFailureKind.AlreadyArchived)]
    [InlineData(null, false, DocumentFailureKind.NotArchived)]
    [InlineData("2026-04-09T12:00:00Z", false, null)]
    public void DocumentRules_Should_ValidateArchiveTransitions(
        string? archivedAtUtc,
        bool archiveRequested,
        DocumentFailureKind? expectedFailure)
    {
        var archivedAt = archivedAtUtc is null
            ? (DateTimeOffset?)null
            : DateTimeOffset.Parse(archivedAtUtc, System.Globalization.CultureInfo.InvariantCulture);

        var failure = DocumentRules.ValidateArchiveTransition(archivedAt, archiveRequested);

        Assert.Equal(expectedFailure, failure);
    }

    [Fact]
    public void DocumentProblemMapping_Should_MapAlreadyArchivedFailure_ToStableProblemContract()
    {
        var problem = PaperBinderDocumentProblemMapping.Map(
            new DocumentFailure(
                DocumentFailureKind.AlreadyArchived,
                "The document is already archived."));

        Assert.Equal(StatusCodes.Status409Conflict, problem.StatusCode);
        Assert.Equal("Document already archived.", problem.Title);
        Assert.Equal(PaperBinderErrorCodes.DocumentAlreadyArchived, problem.ErrorCode);
    }

    [Fact]
    public void DocumentProblemMapping_Should_MapBinderPolicyDenied_ToExistingBinderErrorCode()
    {
        var problem = PaperBinderDocumentProblemMapping.Map(
            new DocumentFailure(
                DocumentFailureKind.BinderPolicyDenied,
                "The current tenant role is not allowed to access the target binder."));

        Assert.Equal(StatusCodes.Status403Forbidden, problem.StatusCode);
        Assert.Equal("Binder access denied.", problem.Title);
        Assert.Equal(PaperBinderErrorCodes.BinderPolicyDenied, problem.ErrorCode);
    }

    [Fact]
    public void DocumentResponseMapping_Should_MapNullableSummaryFields()
    {
        var createdAtUtc = DateTimeOffset.Parse("2026-04-09T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var archivedAtUtc = DateTimeOffset.Parse("2026-04-09T13:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var summary = new DocumentSummary(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Policy Update",
            DocumentRules.MarkdownContentType,
            Guid.NewGuid(),
            createdAtUtc,
            archivedAtUtc);

        var response = PaperBinderDocumentResponseMapping.MapSummary(summary);

        Assert.Equal(summary.DocumentId, response.DocumentId);
        Assert.Equal(summary.BinderId, response.BinderId);
        Assert.Equal(summary.SupersedesDocumentId, response.SupersedesDocumentId);
        Assert.Equal(createdAtUtc, response.CreatedAt);
        Assert.Equal(archivedAtUtc, response.ArchivedAt);
    }
}
