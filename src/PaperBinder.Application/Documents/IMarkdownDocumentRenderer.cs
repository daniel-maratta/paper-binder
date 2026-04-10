namespace PaperBinder.Application.Documents;

public interface IMarkdownDocumentRenderer
{
    MarkdownRenderResult Render(string markdown);
}

public sealed record MarkdownRenderResult(
    string SanitizedHtml);
