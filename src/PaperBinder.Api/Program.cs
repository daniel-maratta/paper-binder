var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var webRootPath = app.Environment.WebRootPath
    ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var frontendEntryPoint = Path.Combine(webRootPath, "index.html");
var shouldServeCompiledFrontend = PaperBinder.Api.FrontendHostingPolicy.ShouldServeCompiledFrontend(
    app.Environment.EnvironmentName,
    File.Exists(frontendEntryPoint));

if (shouldServeCompiledFrontend)
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
    app.MapFallbackToFile("index.html");
}
else
{
    app.MapGet("/", () => Results.Content(
        PaperBinder.Api.BackendLandingPage.Render(app.Environment.EnvironmentName),
        "text/html"));
}

app.Run();
