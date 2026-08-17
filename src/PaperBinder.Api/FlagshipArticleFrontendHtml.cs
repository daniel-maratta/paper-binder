using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace PaperBinder.Api;

internal static class FlagshipArticleFrontendHtml
{
    public const string Path = "/articles/building-paperbinder-production-shaped-saas-demo";

    private const string ProductName = "PaperBinder";
    private const string AuthorName = "Daniel Maratta";
    private const string AuthorUrl = "https://danielmaratta.com";
    private const string CanonicalDemoUrl = "https://paperbinder.danielmaratta.com";
    private const string CanonicalArticleUrl = $"{CanonicalDemoUrl}{Path}";
    private const string SocialImageUrl = $"{CanonicalDemoUrl}/presentation/after-redesign.png";
    private const string ArticleTitle = "Building PaperBinder: From AI-Generated Code to Shippable Software";
    private const string ArticleDescription =
        "A technical article about the engineering practices used to move AI-generated implementation toward production quality in PaperBinder, a constrained SaaS application.";

    public static string Render(string frontendIndexHtml)
    {
        ArgumentNullException.ThrowIfNull(frontendIndexHtml);

        var html = ReplaceFirst(
            frontendIndexHtml,
            @"<title>.*?</title>",
            $"<title>{EncodeHtml($"{ArticleTitle} | {ProductName}")}</title>");

        html = ReplaceFirst(
            html,
            @"<meta\s+name=""description""[^>]*>",
            $"""<meta name="description" content="{EncodeAttribute(ArticleDescription)}" />""");

        html = ReplacePropertyMeta(html, "og:type", "article");
        html = ReplacePropertyMeta(html, "og:title", ArticleTitle);
        html = ReplacePropertyMeta(html, "og:description", ArticleDescription);
        html = ReplacePropertyMeta(html, "og:image", SocialImageUrl);
        html = InsertArticleHeadMetadata(html);
        html = ReplaceFirst(
            html,
            @"\s*<script\s+type=""application/ld\+json"">.*?</script>",
            $"""

                <script id="paperbinder-flagship-article-jsonld" type="application/ld+json">
                  {RenderArticleJsonLd()}
                </script>
            """);

        return html;
    }

    private static string InsertArticleHeadMetadata(string html)
    {
        var metadata = $"""
            <link rel="canonical" href="{CanonicalArticleUrl}" />
            <meta property="og:url" content="{CanonicalArticleUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="{EncodeAttribute(ArticleTitle)}" />
            <meta name="twitter:description" content="{EncodeAttribute(ArticleDescription)}" />
            <meta name="twitter:image" content="{SocialImageUrl}" />

        """;

        return ReplaceFirst(html, @"\s*<script\s+type=""application/ld\+json"">", $"{Environment.NewLine}{metadata}    <script type=\"application/ld+json\">");
    }

    private static string ReplacePropertyMeta(string html, string propertyName, string content) =>
        ReplaceFirst(
            html,
            $@"<meta\s+property=""{Regex.Escape(propertyName)}""[^>]*>",
            $"""<meta property="{propertyName}" content="{EncodeAttribute(content)}" />""");

    private static string RenderArticleJsonLd()
    {
        var structuredData = new Dictionary<string, object?>
        {
            ["@context"] = "https://schema.org",
            ["@type"] = "Article",
            ["headline"] = ArticleTitle,
            ["description"] = ArticleDescription,
            ["image"] = SocialImageUrl,
            ["url"] = CanonicalArticleUrl,
            ["mainEntityOfPage"] = CanonicalArticleUrl,
            ["author"] = new Dictionary<string, string>
            {
                ["@type"] = "Person",
                ["name"] = AuthorName,
                ["url"] = AuthorUrl
            },
            ["publisher"] = new Dictionary<string, string>
            {
                ["@type"] = "Organization",
                ["name"] = ProductName,
                ["url"] = CanonicalDemoUrl
            }
        };

        return JsonSerializer.Serialize(structuredData);
    }

    private static string ReplaceFirst(string input, string pattern, string replacement) =>
        new Regex(pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline, TimeSpan.FromSeconds(1))
            .Replace(input, replacement, count: 1);

    private static string EncodeHtml(string value) => HtmlEncoder.Default.Encode(value);

    private static string EncodeAttribute(string value) => HtmlEncoder.Default.Encode(value);
}
