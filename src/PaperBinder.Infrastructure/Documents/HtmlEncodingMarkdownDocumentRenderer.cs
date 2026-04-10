using System.Text.Encodings.Web;
using PaperBinder.Application.Documents;

namespace PaperBinder.Infrastructure.Documents;

public sealed class HtmlEncodingMarkdownDocumentRenderer : IMarkdownDocumentRenderer
{
    public MarkdownRenderResult Render(string markdown)
    {
        ArgumentNullException.ThrowIfNull(markdown);

        // CP10 establishes a centralized safe-rendering boundary without introducing a markdown parser yet.
        var encodedMarkdown = HtmlEncoder.Default.Encode(markdown);
        return new MarkdownRenderResult($"<pre>{encodedMarkdown}</pre>");
    }
}
