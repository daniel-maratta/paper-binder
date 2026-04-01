using System.Net;

namespace PaperBinder.Api;

public static class BackendLandingPage
{
    public static string Render(string environmentName)
    {
        var encodedEnvironmentName = WebUtility.HtmlEncode(environmentName);

        return $$"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PaperBinder API</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Georgia, "Times New Roman", serif;
    }

    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(160deg, #f6efe6 0%, #f4efe8 48%, #e8ecef 100%);
      color: #1f2933;
    }

    main {
      max-width: 48rem;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }

    section {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(31, 41, 51, 0.12);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 20px 60px -42px rgba(31, 41, 51, 0.45);
    }

    h1 {
      margin: 0 0 0.75rem;
      font-size: clamp(2rem, 3vw, 3rem);
    }

    p, li {
      line-height: 1.7;
      font-size: 1rem;
    }

    .badge {
      display: inline-block;
      margin-bottom: 1rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: #17324d;
      color: #f8fafc;
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.95em;
    }
  </style>
</head>
<body>
  <main>
    <section>
      <span class="badge">Backend Host Live</span>
      <h1>PaperBinder API is running.</h1>
      <p>
        This endpoint is a backend-process live-state page. In ordinary local development,
        the SPA runs separately on <code>http://localhost:5173</code>.
      </p>
      <ul>
        <li>Environment: <code>{{encodedEnvironmentName}}</code></li>
        <li>Purpose: confirm that the API process launched successfully</li>
        <li>Policy: CP1 does not expose interactive API documentation from the backend host</li>
      </ul>
    </section>
  </main>
</body>
</html>
""";
    }
}
