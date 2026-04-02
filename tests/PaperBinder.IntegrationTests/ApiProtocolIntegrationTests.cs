using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class ApiProtocolIntegrationTests
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string CurrentApiVersion = "1";
    private const string UnsupportedApiVersionErrorCode = "API_VERSION_UNSUPPORTED";

    [Fact]
    public async Task Should_DefaultToV1AndGenerateCorrelationId_When_ApiVersionHeaderIsMissing()
    {
        await using var host = await StartHostAsync();

        var response = await host.Client.GetAsync("/api/contracts/probe");
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(CurrentApiVersion, GetRequiredHeader(response, ApiVersionHeader));

        var correlationId = GetRequiredHeader(response, CorrelationIdHeader);

        Assert.Matches("^[a-f0-9]{32}$", correlationId);
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status404NotFound, problem!.Status);
        Assert.Equal("/api/contracts/probe", problem.Instance);
        Assert.False(problem.Extensions.ContainsKey("errorCode"));
        Assert.Equal(correlationId, GetRequiredExtension(problem, "correlationId"));
        Assert.False(string.IsNullOrWhiteSpace(GetRequiredExtension(problem, "traceId")));
    }

    [Theory]
    [InlineData("2")]
    [InlineData("abc")]
    public async Task Should_ReturnBadRequestProblemDetails_When_ApiVersionIsUnsupportedOrMalformed(string requestedVersion)
    {
        await using var host = await StartHostAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Add(ApiVersionHeader, requestedVersion);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(CurrentApiVersion, GetRequiredHeader(response, ApiVersionHeader));

        var correlationId = GetRequiredHeader(response, CorrelationIdHeader);

        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status400BadRequest, problem!.Status);
        Assert.Equal("Unsupported API version.", problem.Title);
        Assert.Equal(UnsupportedApiVersionErrorCode, GetRequiredExtension(problem, "errorCode"));
        Assert.Equal(correlationId, GetRequiredExtension(problem, "correlationId"));
        Assert.Contains("Supported API versions: 1.", problem.Detail);
        Assert.False(string.IsNullOrWhiteSpace(GetRequiredExtension(problem, "traceId")));
    }

    [Fact]
    public async Task Should_EchoCorrelationId_When_ClientSuppliesValidHeader()
    {
        await using var host = await StartHostAsync();

        const string correlationId = "review-path-123";
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Add(CorrelationIdHeader, correlationId);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(correlationId, GetRequiredHeader(response, CorrelationIdHeader));
        Assert.NotNull(problem);
        Assert.Equal(correlationId, GetRequiredExtension(problem!, "correlationId"));
    }

    [Theory]
    [InlineData("contains space")]
    [InlineData("contains,comma")]
    public async Task Should_ReplaceInvalidCorrelationId_When_ClientSuppliesRejectedHeader(string invalidCorrelationId)
    {
        await using var host = await StartHostAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Add(CorrelationIdHeader, invalidCorrelationId);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();
        var resolvedCorrelationId = GetRequiredHeader(response, CorrelationIdHeader);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotEqual(invalidCorrelationId, resolvedCorrelationId);
        Assert.Matches("^[a-f0-9]{32}$", resolvedCorrelationId);
        Assert.NotNull(problem);
        Assert.Equal(resolvedCorrelationId, GetRequiredExtension(problem!, "correlationId"));
    }

    private static async Task<PaperBinderApplicationHost> StartHostAsync()
    {
        var unavailablePort = GetUnusedPort();
        var configuration = TestRuntimeConfiguration.Create(
            $"Host=127.0.0.1;Port={unavailablePort};Database=paperbinder;Username=paperbinder;Password=test-password");

        return await PaperBinderApplicationHost.StartAsync(configuration);
    }

    private static int GetUnusedPort()
    {
        using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();

        return ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
    }

    private static string GetRequiredHeader(HttpResponseMessage response, string headerName)
    {
        Assert.True(response.Headers.TryGetValues(headerName, out var values));
        return Assert.Single(values);
    }

    private static string GetRequiredExtension(ProblemDetailsResponse response, string key)
    {
        Assert.True(response.Extensions.TryGetValue(key, out var value));
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            _ => value.ToString()
        };
    }

    private sealed record ProblemDetailsResponse(
        string? Type,
        string? Title,
        int? Status,
        string? Detail,
        string? Instance)
    {
        [JsonExtensionData]
        public Dictionary<string, JsonElement> Extensions { get; init; } = [];
    }
}
