using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class AuthIntegrationTests(PostgresContainerFixture postgres)
{
    private const string InvalidCredentialsErrorCode = "INVALID_CREDENTIALS";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string TenantForbiddenErrorCode = "TENANT_FORBIDDEN";
    private const string TenantExpiredErrorCode = "TENANT_EXPIRED";
    private const string CsrfHeaderName = "X-CSRF-TOKEN";

    [Fact]
    public async Task Should_LoginAndEstablishTenantContext_When_CredentialsAreValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-login");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-login.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);

        Assert.Equal(HttpStatusCode.OK, session.LoginResponse.StatusCode);
        Assert.Equal($"http://{tenant.Slug}.paperbinder.localhost:8080/app", session.LoginPayload!.RedirectUrl);
        Assert.False(string.IsNullOrWhiteSpace(session.AuthCookieValue));
        Assert.False(string.IsNullOrWhiteSpace(session.CsrfCookieValue));

        using var request = new HttpRequestMessage(HttpMethod.Get, "/__tests/tenant-context");
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var tenantContextResponse = await host.Client.SendAsync(request);
        var tenantContextPayload = await tenantContextResponse.Content.ReadFromJsonAsync<TenantContextResponse>();

        Assert.Equal(HttpStatusCode.OK, tenantContextResponse.StatusCode);
        Assert.NotNull(tenantContextPayload);
        Assert.True(tenantContextPayload!.IsEstablished);
        Assert.False(tenantContextPayload.IsSystemContext);
        Assert.Equal(tenant.Id, tenantContextPayload.TenantId);
        Assert.Equal(tenant.Slug, tenantContextPayload.TenantSlug);
    }

    [Fact]
    public async Task Should_ReturnUnauthorizedProblemDetails_When_LoginCredentialsAreInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-invalid-login");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-invalid.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        using var request = AuthIntegrationTestClient.CreateLoginRequest(user.Email, "wrong-password");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(InvalidCredentialsErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_LoginUserHasNoTenantMembership()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-no-membership.local", "checkpoint-6-password");
        using var request = AuthIntegrationTestClient.CreateLoginRequest(user.Email, user.Password);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantForbiddenErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_Logout_When_TenantHostRequestIncludesValidCsrfToken()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-logout");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-logout.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout")
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());
        request.Headers.Add(CsrfHeaderName, session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var setCookieValues));
        Assert.Contains(setCookieValues, value => value.StartsWith($"{AuthIntegrationTestClient.AuthCookieName}=", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(setCookieValues, value => value.StartsWith($"{AuthIntegrationTestClient.CsrfCookieName}=", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Should_RejectLogout_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-logout-csrf");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-logout-csrf.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout")
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectLogout_When_CsrfTokenIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-logout-csrf-invalid");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-logout-csrf-invalid.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout")
        {
            Content = JsonContent.Create(new { })
        };
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());
        request.Headers.Add(CsrfHeaderName, "invalid-token");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_AuthenticatedUserTargetsDifferentTenantHost()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var loginTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-tenant-b");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-tenant-a.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, loginTenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Host = $"{otherTenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantForbiddenErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnGone_When_AuthenticatedTenantExpiresBeforeTenantHostRequest()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-expire-host");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-expire-host.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        await TenantResolutionIntegrationTestHost.ExpireTenantAsync(host, tenant);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantExpiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnGone_When_LoginTargetsExpiredTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp6-expire-login");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp6-expire-login.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);
        await TenantResolutionIntegrationTestHost.ExpireTenantAsync(host, tenant);

        using var request = AuthIntegrationTestClient.CreateLoginRequest(user.Email, user.Password);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantExpiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }
}

internal static class AuthIntegrationTestClient
{
    public const string AuthCookieName = "paperbinder.auth";
    public const string CsrfCookieName = AuthCookieName + ".csrf";

    public static HttpRequestMessage CreateLoginRequest(string email, string password)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new
            {
                email,
                password
            })
        };

        request.Headers.Host = "paperbinder.localhost";
        return request;
    }

    public static async Task<AuthenticatedSession> LoginAsync(
        PaperBinderApplicationHost host,
        string email,
        string password)
    {
        using var request = CreateLoginRequest(email, password);
        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<LoginResponsePayload>();
        var cookies = ParseCookieValues(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(cookies.TryGetValue(AuthCookieName, out var authCookieValue));
        Assert.True(cookies.TryGetValue(CsrfCookieName, out var csrfCookieValue));

        return new AuthenticatedSession(response, payload, authCookieValue, csrfCookieValue);
    }

    private static Dictionary<string, string> ParseCookieValues(HttpResponseMessage response)
    {
        var cookies = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (!response.Headers.TryGetValues("Set-Cookie", out var headerValues))
        {
            return cookies;
        }

        foreach (var headerValue in headerValues)
        {
            var firstSegment = headerValue.Split(';', 2, StringSplitOptions.TrimEntries)[0];
            var parts = firstSegment.Split('=', 2);
            if (parts.Length == 2)
            {
                cookies[parts[0]] = parts[1];
            }
        }

        return cookies;
    }
}

internal sealed record AuthenticatedSession(
    HttpResponseMessage LoginResponse,
    LoginResponsePayload? LoginPayload,
    string AuthCookieValue,
    string CsrfCookieValue)
{
    public string ToCookieHeader() =>
        $"{AuthIntegrationTestClient.AuthCookieName}={AuthCookieValue}; {AuthIntegrationTestClient.CsrfCookieName}={CsrfCookieValue}";
}

internal sealed record LoginResponsePayload(
    [property: JsonPropertyName("redirectUrl")] string RedirectUrl);
