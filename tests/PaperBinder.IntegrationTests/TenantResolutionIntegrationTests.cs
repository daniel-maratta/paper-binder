using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Api;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.NonDocker)]
public sealed class TenantResolutionHostBoundaryIntegrationTests
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string CurrentApiVersion = "1";
    private const string InvalidHostErrorCode = "TENANT_HOST_INVALID";

    [Fact]
    public async Task Should_AllowLoopbackRequestsAsSystemContext_When_RunningInDevelopment()
    {
        await using var host = await TenantResolutionIntegrationTestHost.StartNonDockerHostAsync();

        var response = await host.Client.GetFromJsonAsync<TenantContextResponse>("/__tests/tenant-context");

        Assert.NotNull(response);
        Assert.True(response!.IsEstablished);
        Assert.True(response.IsSystemContext);
        Assert.Null(response.TenantId);
        Assert.Null(response.TenantSlug);
    }

    [Fact]
    public async Task Should_ReturnBadRequestProblemDetails_When_HostIsOutsideConfiguredBaseDomain()
    {
        await using var host = await TenantResolutionIntegrationTestHost.StartNonDockerHostAsync();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe");
        request.Headers.Host = "attacker.example.test";

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(CurrentApiVersion, TenantResolutionIntegrationTestHost.GetRequiredHeader(response, ApiVersionHeader));
        Assert.False(string.IsNullOrWhiteSpace(TenantResolutionIntegrationTestHost.GetRequiredHeader(response, CorrelationIdHeader)));
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status400BadRequest, problem!.Status);
        Assert.Equal(InvalidHostErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem, "errorCode"));
    }

    [Fact]
    public async Task Should_RegisterTenantLookupServiceAsScoped()
    {
        await using var host = await TenantResolutionIntegrationTestHost.StartNonDockerHostAsync();

        using var firstScope = host.Application.Services.CreateScope();
        using var secondScope = host.Application.Services.CreateScope();

        var firstResolution = firstScope.ServiceProvider.GetRequiredService<ITenantLookupService>();
        var repeatedFirstResolution = firstScope.ServiceProvider.GetRequiredService<ITenantLookupService>();
        var secondResolution = secondScope.ServiceProvider.GetRequiredService<ITenantLookupService>();

        Assert.Same(firstResolution, repeatedFirstResolution);
        Assert.NotSame(firstResolution, secondResolution);
    }
}

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class TenantResolutionDatabaseIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CurrentApiVersion = "1";
    private const string TenantNotFoundErrorCode = "TENANT_NOT_FOUND";

    [Fact]
    public async Task Should_NotEstablishTenantContextForAnonymousTenantHostRequests()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp5-known-tenant");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/__tests/tenant-context");
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantContextResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.False(payload!.IsEstablished);
        Assert.False(payload.IsSystemContext);
        Assert.Null(payload.TenantId);
        Assert.Null(payload.TenantSlug);
        Assert.Null(payload.TenantName);
    }

    [Fact]
    public async Task Should_IgnoreSpoofedTenantHints_When_HostResolvesKnownTenantForAuthenticatedUser()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp5-hint-target");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp5-hint-target.local", "checkpoint-6-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/__tests/tenant-context?tenantId=00000000-0000-0000-0000-000000000999");
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("X-Tenant-Id", Guid.NewGuid().ToString("D"));
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantContextResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(tenant.Id, payload!.TenantId);
        Assert.Equal(tenant.Slug, payload.TenantSlug);
    }

    [Fact]
    public async Task Should_ReturnNotFoundForUnknownTenantHost_EvenWhen_ClientSuppliesSpoofedHints()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp5-known-seed");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/contracts/probe?tenantId=spoofed");
        request.Headers.Host = "cp5-missing.paperbinder.localhost";
        request.Headers.Add("X-Tenant-Id", tenant.Id.ToString("D"));

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(CurrentApiVersion, TenantResolutionIntegrationTestHost.GetRequiredHeader(response, ApiVersionHeader));
        Assert.NotNull(problem);
        Assert.Equal(StatusCodes.Status404NotFound, problem!.Status);
        Assert.Equal(TenantNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem, "errorCode"));
    }
}

internal static class TenantResolutionIntegrationTestHost
{
    public static async Task<PaperBinderApplicationHost> StartNonDockerHostAsync()
    {
        var unavailablePort = GetUnusedPort();
        var configuration = TestRuntimeConfiguration.Create(
            $"Host=127.0.0.1;Port={unavailablePort};Database=paperbinder;Username=paperbinder;Password=test-password");

        return await PaperBinderApplicationHost.StartAsync(configuration, ConfigureTenantContextProbe);
    }

    public static async Task<PaperBinderApplicationHost> StartDockerHostAsync(string databaseConnection) =>
        await PaperBinderApplicationHost.StartAsync(
            TestRuntimeConfiguration.Create(databaseConnection),
            ConfigureTenantContextProbe);

    public static async Task<SeededTenant> SeedTenantAsync(PaperBinderApplicationHost host, string slug)
    {
        var tenant = new SeededTenant(
            Guid.NewGuid(),
            slug,
            "CP5 Seed Tenant",
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow.AddMinutes(60));

        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();
        await connection.ExecuteAsync(
            """
            insert into tenants (id, slug, name, created_at_utc, expires_at_utc, lease_extension_count)
            values (@Id, @Slug, @Name, @CreatedAtUtc, @ExpiresAtUtc, 0);
            """,
            tenant);

        return tenant;
    }

    public static async Task<SeededUser> SeedUserAsync(
        PaperBinderApplicationHost host,
        string email,
        string password)
    {
        using var scope = host.Application.Services.CreateScope();
        var user = new PaperBinderUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            NormalizedUserName = email.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            EmailConfirmed = true,
            SecurityStamp = Guid.NewGuid().ToString("N")
        };

        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<PaperBinderUser>>();
        user.PasswordHash = passwordHasher.HashPassword(user, password);

        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();
        await connection.ExecuteAsync(
            """
            insert into users (
                id,
                user_name,
                normalized_user_name,
                email,
                normalized_email,
                email_confirmed,
                password_hash,
                security_stamp)
            values (
                @Id,
                @UserName,
                @NormalizedUserName,
                @Email,
                @NormalizedEmail,
                @EmailConfirmed,
                @PasswordHash,
                @SecurityStamp);
            """,
            user);

        return new SeededUser(user.Id, user.Email, password);
    }

    public static async Task SeedMembershipAsync(
        PaperBinderApplicationHost host,
        SeededUser user,
        SeededTenant tenant,
        TenantRole role = TenantRole.TenantAdmin,
        bool isOwner = true)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();
        await connection.ExecuteAsync(
            """
            insert into user_tenants (user_id, tenant_id, role, is_owner)
            values (@UserId, @TenantId, @Role, @IsOwner);
            """,
            new
            {
                UserId = user.Id,
                TenantId = tenant.Id,
                Role = role.ToString(),
                IsOwner = isOwner
            });
    }

    public static async Task ExpireTenantAsync(PaperBinderApplicationHost host, SeededTenant tenant)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();
        await connection.ExecuteAsync(
            """
            update tenants
            set expires_at_utc = @ExpiresAtUtc
            where id = @TenantId;
            """,
            new
            {
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
                TenantId = tenant.Id
            });
    }

    public static string GetRequiredHeader(HttpResponseMessage response, string headerName)
    {
        Assert.True(response.Headers.TryGetValues(headerName, out var values));
        return Assert.Single(values);
    }

    public static string GetRequiredExtension(ProblemDetailsResponse response, string key)
    {
        Assert.True(response.Extensions.TryGetValue(key, out var value));
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            _ => value.ToString()
        };
    }

    private static void ConfigureTenantContextProbe(WebApplication app)
    {
        app.MapGet("/__tests/tenant-context", (IRequestTenantContext tenantContext) =>
            Results.Json(
                new TenantContextResponse(
                    tenantContext.IsEstablished,
                    tenantContext.IsSystemContext,
                    tenantContext.Tenant?.TenantId,
                    tenantContext.Tenant?.TenantSlug,
                    tenantContext.Tenant?.TenantName)));
    }

    private static int GetUnusedPort()
    {
        using var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        listener.Start();

        return ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
    }
}

internal sealed record TenantContextResponse(
    bool IsEstablished,
    bool IsSystemContext,
    Guid? TenantId,
    string? TenantSlug,
    string? TenantName);

internal sealed record SeededTenant(
    Guid Id,
    string Slug,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset ExpiresAtUtc);

internal sealed record SeededUser(
    Guid Id,
    string Email,
    string Password);

internal sealed record ProblemDetailsResponse(
    string? Type,
    string? Title,
    int? Status,
    string? Detail,
    string? Instance)
{
    [JsonExtensionData]
    public Dictionary<string, JsonElement> Extensions { get; init; } = [];
}
