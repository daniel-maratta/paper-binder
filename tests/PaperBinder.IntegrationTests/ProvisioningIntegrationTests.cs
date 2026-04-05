using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Api;
using PaperBinder.Application.Persistence;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class ProvisioningIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ChallengeRequiredErrorCode = "CHALLENGE_REQUIRED";
    private const string RateLimitedErrorCode = "RATE_LIMITED";
    private const string TenantNameConflictErrorCode = "TENANT_NAME_CONFLICT";

    [Fact]
    public async Task Should_ProvisionTenant_AndEstablishAuthenticatedSession()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var beforeProvision = DateTimeOffset.UtcNow;
        var session = await ProvisioningIntegrationTestClient.ProvisionAsync(host, "Acme Demo");
        var afterProvision = DateTimeOffset.UtcNow;

        Assert.Equal(HttpStatusCode.Created, session.ProvisionResponse.StatusCode);
        Assert.NotNull(session.ProvisionPayload);
        Assert.Equal("acme-demo", session.ProvisionPayload!.TenantSlug);
        Assert.Equal("http://acme-demo.paperbinder.localhost:8080/app", session.ProvisionPayload.RedirectUrl);
        Assert.False(string.IsNullOrWhiteSpace(session.ProvisionPayload.Credentials.Email));
        Assert.False(string.IsNullOrWhiteSpace(session.ProvisionPayload.Credentials.Password));
        Assert.InRange(
            session.ProvisionPayload.ExpiresAt,
            beforeProvision.AddMinutes(59),
            afterProvision.AddMinutes(61));

        using var request = new HttpRequestMessage(HttpMethod.Get, "/__tests/tenant-context");
        request.Headers.Host = $"{session.ProvisionPayload.TenantSlug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var tenantContextResponse = await host.Client.SendAsync(request);
        var tenantContextPayload = await tenantContextResponse.Content.ReadFromJsonAsync<TenantContextResponse>();

        Assert.Equal(HttpStatusCode.OK, tenantContextResponse.StatusCode);
        Assert.NotNull(tenantContextPayload);
        Assert.True(tenantContextPayload!.IsEstablished);
        Assert.False(tenantContextPayload.IsSystemContext);
        Assert.Equal(session.ProvisionPayload.TenantId, tenantContextPayload.TenantId);
        Assert.Equal(session.ProvisionPayload.TenantSlug, tenantContextPayload.TenantSlug);
    }

    [Fact]
    public async Task Should_RejectProvisioning_When_ChallengeTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        using var request = ProvisioningIntegrationTestClient.CreateProvisionRequest("Acme Demo", challengeToken: null);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(ChallengeRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_ProvisioningTargetsTenantHost()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp7-provision-tenant-host");
        using var request = ProvisioningIntegrationTestClient.CreateProvisionRequest("Tenant Host Rejected");
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_RateLimit_RepeatedLoginRequests_When_PreAuthLimitIsOne()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitPreAuthPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp7-login-rate-limit");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp7-login-rate-limit.local", "checkpoint-7-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var secondRequest = AuthIntegrationTestClient.CreateLoginRequest(user.Email, user.Password);

        var response = await host.Client.SendAsync(secondRequest);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(RateLimitedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
        Assert.True(response.Headers.TryGetValues("Retry-After", out var retryAfterValues));
        Assert.False(string.IsNullOrWhiteSpace(Assert.Single(retryAfterValues)));
    }

    [Fact]
    public async Task Should_SharePreAuthRateLimitBudgetAcrossLoginAndProvision_When_LimitIsOne()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitPreAuthPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp7-shared-budget");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp7-shared-budget.local", "checkpoint-7-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var provisionRequest = ProvisioningIntegrationTestClient.CreateProvisionRequest("Blocked By Shared Budget");

        var response = await host.Client.SendAsync(provisionRequest);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(RateLimitedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));

        var counts = await GetProvisioningCountsAsync(
            host,
            "blocked-by-shared-budget",
            "owner@blocked-by-shared-budget.local");

        Assert.Equal(0, counts.TenantCount);
        Assert.Equal(0, counts.UserCount);
        Assert.Equal(0, counts.MembershipCount);
    }

    [Fact]
    public async Task Should_ReturnConflictAndPreserveExistingState_When_TenantNameAlreadyExists()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        await ProvisioningIntegrationTestClient.ProvisionAsync(host, "Conflict Tenant");
        using var secondRequest = ProvisioningIntegrationTestClient.CreateProvisionRequest("Conflict Tenant");

        var response = await host.Client.SendAsync(secondRequest);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantNameConflictErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));

        var counts = await GetProvisioningCountsAsync(
            host,
            "conflict-tenant",
            "owner@conflict-tenant.local");

        Assert.Equal(1, counts.TenantCount);
        Assert.Equal(1, counts.UserCount);
        Assert.Equal(1, counts.MembershipCount);
    }

    private static async Task<ProvisioningCounts> GetProvisioningCountsAsync(
        PaperBinderApplicationHost host,
        string tenantSlug,
        string ownerEmail)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();

        return await connection.QuerySingleAsync<ProvisioningCounts>(
            """
            select
                (select count(*) from tenants where slug = @TenantSlug) as TenantCount,
                (select count(*) from users where email = @OwnerEmail) as UserCount,
                (
                    select count(*)
                    from user_tenants ut
                    inner join users u on u.id = ut.user_id
                    inner join tenants t on t.id = ut.tenant_id
                    where t.slug = @TenantSlug
                      and u.email = @OwnerEmail
                ) as MembershipCount;
            """,
            new
            {
                TenantSlug = tenantSlug,
                OwnerEmail = ownerEmail
            });
    }
}

internal static class ProvisioningIntegrationTestClient
{
    public static HttpRequestMessage CreateProvisionRequest(
        string tenantName,
        string? challengeToken = PaperBinderChallengeVerification.TestBypassToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/provision")
        {
            Content = JsonContent.Create(new
            {
                tenantName,
                challengeToken
            })
        };

        request.Headers.Host = "paperbinder.localhost";
        return request;
    }

    public static async Task<ProvisionedSession> ProvisionAsync(
        PaperBinderApplicationHost host,
        string tenantName,
        string? challengeToken = PaperBinderChallengeVerification.TestBypassToken)
    {
        using var request = CreateProvisionRequest(tenantName, challengeToken);
        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<ProvisionResponsePayload>();
        var cookies = AuthIntegrationTestClient.ParseCookieValues(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.True(cookies.TryGetValue(AuthIntegrationTestClient.AuthCookieName, out var authCookieValue));
        Assert.True(cookies.TryGetValue(AuthIntegrationTestClient.CsrfCookieName, out var csrfCookieValue));

        return new ProvisionedSession(response, payload, authCookieValue, csrfCookieValue);
    }
}

internal sealed record ProvisionedSession(
    HttpResponseMessage ProvisionResponse,
    ProvisionResponsePayload? ProvisionPayload,
    string AuthCookieValue,
    string CsrfCookieValue)
{
    public string ToCookieHeader() =>
        $"{AuthIntegrationTestClient.AuthCookieName}={AuthCookieValue}; {AuthIntegrationTestClient.CsrfCookieName}={CsrfCookieValue}";
}

internal sealed record ProvisionResponsePayload(
    [property: JsonPropertyName("tenantId")] Guid TenantId,
    [property: JsonPropertyName("tenantSlug")] string TenantSlug,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset ExpiresAt,
    [property: JsonPropertyName("redirectUrl")] string RedirectUrl,
    [property: JsonPropertyName("credentials")] ProvisionCredentialsPayload Credentials);

internal sealed record ProvisionCredentialsPayload(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password);

internal sealed class ProvisioningCounts
{
    public long TenantCount { get; init; }

    public long UserCount { get; init; }

    public long MembershipCount { get; init; }
}
