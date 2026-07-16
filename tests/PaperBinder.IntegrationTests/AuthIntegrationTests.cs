using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using PaperBinder.Api;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class AuthIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ChallengeRequiredErrorCode = "CHALLENGE_REQUIRED";
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
    public async Task Should_RejectLogin_When_ChallengeTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp7-login-missing-challenge");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp7-login-missing.local", "checkpoint-7-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        using var request = AuthIntegrationTestClient.CreateLoginRequest(user.Email, user.Password, challengeToken: null);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(ChallengeRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
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
        var payload = await response.Content.ReadFromJsonAsync<LogoutResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal("http://paperbinder.localhost:8080/login", payload!.RedirectUrl);
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

    [Fact]
    public async Task Should_ConstructProvisionLoginAndLogoutRedirects_FromConfiguredPublicRootUrl_When_RequestCarriesSpoofedHostHeaders()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-redirects");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-redirects.local", "checkpoint-16-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var loginRequest = AuthIntegrationTestClient.CreateLoginRequest(user.Email, user.Password);
        loginRequest.Headers.Host = "paperbinder.localhost:65000";
        loginRequest.Headers.Add("X-Forwarded-Host", "attacker.example.test");

        var loginResponse = await host.Client.SendAsync(loginRequest);
        var loginPayload = await loginResponse.Content.ReadFromJsonAsync<LoginResponsePayload>();
        var loginCookies = AuthIntegrationTestClient.ParseCookieValues(loginResponse);

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.NotNull(loginPayload);
        Assert.Equal($"http://{tenant.Slug}.paperbinder.localhost:8080/app", loginPayload!.RedirectUrl);
        Assert.True(loginCookies.TryGetValue(AuthIntegrationTestClient.AuthCookieName, out var authCookieValue));
        Assert.True(loginCookies.TryGetValue(AuthIntegrationTestClient.CsrfCookieName, out var csrfCookieValue));

        using var provisionRequest = ProvisioningIntegrationTestClient.CreateProvisionRequest("Spoofed Host Provision");
        provisionRequest.Headers.Host = "paperbinder.localhost:65000";
        provisionRequest.Headers.Add("X-Forwarded-Host", "attacker.example.test");

        var provisionResponse = await host.Client.SendAsync(provisionRequest);
        var provisionPayload = await provisionResponse.Content.ReadFromJsonAsync<ProvisionResponsePayload>();

        Assert.Equal(HttpStatusCode.Created, provisionResponse.StatusCode);
        Assert.NotNull(provisionPayload);
        Assert.Equal("http://spoofed-host-provision.paperbinder.localhost:8080/app", provisionPayload!.RedirectUrl);

        using var logoutRequest = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout")
        {
            Content = JsonContent.Create(new { })
        };
        logoutRequest.Headers.Host = $"{tenant.Slug}.paperbinder.localhost:65000";
        logoutRequest.Headers.Add("X-Forwarded-Host", "attacker.example.test");
        logoutRequest.Headers.Add(
            "Cookie",
            $"{AuthIntegrationTestClient.AuthCookieName}={authCookieValue}; {AuthIntegrationTestClient.CsrfCookieName}={csrfCookieValue}");
        logoutRequest.Headers.Add(CsrfHeaderName, csrfCookieValue);

        var logoutResponse = await host.Client.SendAsync(logoutRequest);
        var logoutPayload = await logoutResponse.Content.ReadFromJsonAsync<LogoutResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
        Assert.NotNull(logoutPayload);
        Assert.Equal("http://paperbinder.localhost:8080/login", logoutPayload!.RedirectUrl);
    }
}

internal static class AuthIntegrationTestClient
{
    public const string AuthCookieName = "paperbinder.auth";
    public const string CsrfCookieName = AuthCookieName + ".csrf";

    public static HttpRequestMessage CreateLoginRequest(
        string email,
        string password,
        string? challengeToken = PaperBinderChallengeVerification.TestBypassToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/login")
        {
            Content = JsonContent.Create(new
            {
                email,
                password,
                challengeToken
            })
        };

        request.Headers.Host = "paperbinder.localhost";
        return request;
    }

    public static async Task<AuthenticatedSession> LoginAsync(
        PaperBinderApplicationHost host,
        string email,
        string password,
        string? challengeToken = PaperBinderChallengeVerification.TestBypassToken)
    {
        using var request = CreateLoginRequest(email, password, challengeToken);
        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<LoginResponsePayload>();
        var cookies = ParseCookieValues(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(cookies.TryGetValue(AuthCookieName, out var authCookieValue));
        Assert.True(cookies.TryGetValue(CsrfCookieName, out var csrfCookieValue));

        return new AuthenticatedSession(response, payload, authCookieValue, csrfCookieValue);
    }

    internal static Dictionary<string, string> ParseCookieValues(HttpResponseMessage response)
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

internal sealed record LogoutResponsePayload(
    [property: JsonPropertyName("redirectUrl")] string RedirectUrl);
