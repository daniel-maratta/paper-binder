using System.Net;

namespace PaperBinder.Api;

internal static class TenantHostFailurePage
{
    public static string Render(string title, string detail)
    {
        var encodedTitle = WebUtility.HtmlEncode(title);
        var encodedDetail = WebUtility.HtmlEncode(detail);

        return
        $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{encodedTitle}}</title>
          <style>
            :root {
              color-scheme: light;
              font-family: "Segoe UI", system-ui, sans-serif;
              background: #0f172a;
              color: #e2e8f0;
            }

            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background:
                radial-gradient(circle at top, rgba(251, 146, 60, 0.35), transparent 42%),
                linear-gradient(180deg, #0f172a, #111827);
            }

            main {
              width: min(36rem, calc(100vw - 2rem));
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 1.5rem;
              padding: 2rem;
              background: rgba(15, 23, 42, 0.86);
              box-shadow: 0 25px 70px -40px rgba(15, 23, 42, 0.85);
            }

            p:first-child {
              margin: 0;
              color: #fdba74;
              text-transform: uppercase;
              letter-spacing: 0.28em;
              font-size: 0.75rem;
            }

            h1 {
              margin: 1rem 0 0;
              font-size: clamp(2rem, 4vw, 2.6rem);
            }

            p:last-child {
              margin: 1rem 0 0;
              color: #cbd5e1;
              line-height: 1.7;
            }
          </style>
        </head>
        <body>
          <main>
            <p>PaperBinder</p>
            <h1>{{encodedTitle}}</h1>
            <p>{{encodedDetail}}</p>
          </main>
        </body>
        </html>
        """;
    }
}
