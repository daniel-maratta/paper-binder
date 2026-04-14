using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Api;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class TenantLeaseLifecycleIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string CurrentApiVersion = "1";
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string RateLimitedErrorCode = "RATE_LIMITED";
    private const string TenantExpiredErrorCode = "TENANT_EXPIRED";
    private const string TenantNotFoundErrorCode = "TENANT_NOT_FOUND";
    private const string TenantLeaseExtensionWindowNotOpenErrorCode = "TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN";
    private const string TenantLeaseExtensionLimitReachedErrorCode = "TENANT_LEASE_EXTENSION_LIMIT_REACHED";

    [Fact]
    public async Task Should_ReturnLeaseState_When_AuthenticatedMemberTargetsActiveTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-read",
            createdAtUtc: now.AddMinutes(-30),
            expiresAtUtc: now.AddMinutes(8),
            leaseExtensionCount: 1);
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp11-lease-read.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, PaperBinderTenantLeaseRoutes.LeasePath);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantLeasePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);
        Assert.Equal(now.AddMinutes(8), payload!.ExpiresAt);
        Assert.Equal(480, payload.SecondsRemaining);
        Assert.Equal(1, payload.ExtensionCount);
        Assert.Equal(3, payload.MaxExtensions);
        Assert.True(payload.CanExtend);
    }

    [Fact]
    public async Task Should_ExtendLease_When_TenantAdminCallsWithinAllowedWindow()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-extend",
            createdAtUtc: now.AddMinutes(-20),
            expiresAtUtc: now.AddMinutes(5),
            leaseExtensionCount: 1);
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp11-lease-extend.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { tenantId = Guid.NewGuid(), durationMinutes = 99 },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantLeasePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);
        Assert.Equal(now.AddMinutes(15), payload!.ExpiresAt);
        Assert.Equal(900, payload.SecondsRemaining);
        Assert.Equal(2, payload.ExtensionCount);
        Assert.Equal(3, payload.MaxExtensions);
        Assert.False(payload.CanExtend);

        var leaseRow = await GetTenantLeaseRowAsync(host, tenant.Id);
        Assert.NotNull(leaseRow);
        Assert.Equal(now.AddMinutes(15), leaseRow!.ExpiresAtUtc);
        Assert.Equal(2, leaseRow.ExtensionCount);
    }

    [Fact]
    public async Task Should_ReturnConflict_When_LeaseExtensionWindowIsNotOpen_OrLimitIsReached()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var earlyTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-too-early",
            createdAtUtc: now.AddMinutes(-10),
            expiresAtUtc: now.AddMinutes(15),
            leaseExtensionCount: 0);
        var earlyAdmin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp11-lease-too-early.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, earlyAdmin, earlyTenant, TenantRole.TenantAdmin);

        var limitTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-limit",
            createdAtUtc: now.AddMinutes(-10),
            expiresAtUtc: now.AddMinutes(5),
            leaseExtensionCount: 3);
        var limitAdmin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp11-lease-limit.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, limitAdmin, limitTenant, TenantRole.TenantAdmin);

        var earlySession = await AuthIntegrationTestClient.LoginAsync(host, earlyAdmin.Email, earlyAdmin.Password);
        using var earlyRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            earlyTenant,
            earlySession,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { },
            csrfToken: earlySession.CsrfCookieValue);

        var earlyResponse = await host.Client.SendAsync(earlyRequest);
        var earlyProblem = await earlyResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, earlyResponse.StatusCode);
        AssertApiProtocolHeaders(earlyResponse);
        Assert.NotNull(earlyProblem);
        Assert.Equal(TenantLeaseExtensionWindowNotOpenErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(earlyProblem!, "errorCode"));

        var limitSession = await AuthIntegrationTestClient.LoginAsync(host, limitAdmin.Email, limitAdmin.Password);
        using var limitRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            limitTenant,
            limitSession,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { },
            csrfToken: limitSession.CsrfCookieValue);

        var limitResponse = await host.Client.SendAsync(limitRequest);
        var limitProblem = await limitResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, limitResponse.StatusCode);
        AssertApiProtocolHeaders(limitResponse);
        Assert.NotNull(limitProblem);
        Assert.Equal(TenantLeaseExtensionLimitReachedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(limitProblem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectLeaseExtend_When_CsrfTokenIsMissing_OrCallerLacksTenantAdmin()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-authz",
            createdAtUtc: now.AddMinutes(-10),
            expiresAtUtc: now.AddMinutes(5));
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp11-lease-authz.local", "checkpoint-11-password");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp11-lease-authz.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var adminSession = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var missingCsrfRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            adminSession,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { });

        var missingCsrfResponse = await host.Client.SendAsync(missingCsrfRequest);
        var missingCsrfProblem = await missingCsrfResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, missingCsrfResponse.StatusCode);
        AssertApiProtocolHeaders(missingCsrfResponse);
        Assert.NotNull(missingCsrfProblem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(missingCsrfProblem!, "errorCode"));

        var writerSession = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var nonAdminRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            writerSession,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { },
            csrfToken: writerSession.CsrfCookieValue);

        var nonAdminResponse = await host.Client.SendAsync(nonAdminRequest);

        Assert.Equal(HttpStatusCode.Forbidden, nonAdminResponse.StatusCode);
        AssertApiProtocolHeaders(nonAdminResponse);
    }

    [Fact]
    public async Task Should_ReturnTooManyRequests_When_LeaseExtendRateLimitIsExceeded()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(
            database.ConnectionString,
            clock,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitLeaseExtendPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-lease-rate-limit",
            createdAtUtc: now.AddMinutes(-10),
            expiresAtUtc: now.AddMinutes(5));
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp11-lease-rate-limit.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var firstRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { },
            csrfToken: session.CsrfCookieValue);

        var firstResponse = await host.Client.SendAsync(firstRequest);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        using var secondRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            PaperBinderTenantLeaseRoutes.LeaseExtendPath,
            body: new { },
            csrfToken: session.CsrfCookieValue);

        var secondResponse = await host.Client.SendAsync(secondRequest);
        var problem = await secondResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.TooManyRequests, secondResponse.StatusCode);
        AssertApiProtocolHeaders(secondResponse);
        Assert.NotNull(problem);
        Assert.Equal(RateLimitedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
        Assert.True(secondResponse.Headers.TryGetValues("Retry-After", out var retryAfterValues));
        Assert.False(string.IsNullOrWhiteSpace(Assert.Single(retryAfterValues)));
    }

    [Fact]
    public async Task Should_DeleteExpiredTenantData_When_CleanupCycleRuns()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-cleanup-delete",
            createdAtUtc: now.AddHours(-1),
            expiresAtUtc: now.AddMinutes(-1),
            leaseExtensionCount: 2);
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp11-cleanup-delete.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant, TenantRole.TenantAdmin);
        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Expired Binder");
        var document = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Expired Document", "# expired");

        var result = await RunCleanupCycleAsync(host);

        Assert.Equal(1, result.SelectedTenantCount);
        Assert.Equal(1, result.PurgedTenantCount);
        Assert.Equal(0, result.SkippedTenantCount);
        Assert.Equal(0, result.FailedTenantCount);

        var counts = await GetTenantOwnedRowCountsAsync(host, tenant.Id, user.Id, binder.Id, document.Id);
        Assert.Equal(0, counts.TenantCount);
        Assert.Equal(0, counts.MembershipCount);
        Assert.Equal(0, counts.UserCount);
        Assert.Equal(0, counts.BinderCount);
        Assert.Equal(0, counts.BinderPolicyCount);
        Assert.Equal(0, counts.DocumentCount);
    }

    [Fact]
    public async Task Should_NotDeleteActiveTenants_And_Should_BeIdempotent_When_CleanupCycleRunsRepeatedly()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var expiredTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-cleanup-expired",
            createdAtUtc: now.AddHours(-1),
            expiresAtUtc: now.AddMinutes(-1));
        var expiredUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp11-cleanup-expired.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, expiredUser, expiredTenant, TenantRole.TenantAdmin);
        var expiredBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, expiredTenant, "Expired Binder");
        var expiredDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, expiredTenant, expiredBinder, "Expired Document", "# expired");

        var activeTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-cleanup-active",
            createdAtUtc: now.AddHours(-1),
            expiresAtUtc: now.AddMinutes(30));
        var activeUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp11-cleanup-active.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, activeUser, activeTenant, TenantRole.TenantAdmin);
        var activeBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, activeTenant, "Active Binder");
        var activeDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, activeTenant, activeBinder, "Active Document", "# active");

        var firstResult = await RunCleanupCycleAsync(host);
        var secondResult = await RunCleanupCycleAsync(host);

        Assert.Equal(1, firstResult.SelectedTenantCount);
        Assert.Equal(1, firstResult.PurgedTenantCount);
        Assert.Equal(0, firstResult.SkippedTenantCount);
        Assert.Equal(0, firstResult.FailedTenantCount);

        Assert.Equal(0, secondResult.SelectedTenantCount);
        Assert.Equal(0, secondResult.PurgedTenantCount);
        Assert.Equal(0, secondResult.SkippedTenantCount);
        Assert.Equal(0, secondResult.FailedTenantCount);

        var expiredCounts = await GetTenantOwnedRowCountsAsync(host, expiredTenant.Id, expiredUser.Id, expiredBinder.Id, expiredDocument.Id);
        Assert.Equal(0, expiredCounts.TenantCount);
        Assert.Equal(0, expiredCounts.UserCount);
        Assert.Equal(0, expiredCounts.DocumentCount);

        var activeCounts = await GetTenantOwnedRowCountsAsync(host, activeTenant.Id, activeUser.Id, activeBinder.Id, activeDocument.Id);
        Assert.Equal(1, activeCounts.TenantCount);
        Assert.Equal(1, activeCounts.MembershipCount);
        Assert.Equal(1, activeCounts.UserCount);
        Assert.Equal(1, activeCounts.BinderCount);
        Assert.Equal(1, activeCounts.BinderPolicyCount);
        Assert.Equal(1, activeCounts.DocumentCount);
    }

    [Fact]
    public async Task Should_ReturnGone_BeforePurge_AndNotFound_AfterPurge()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        var now = DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture);
        var clock = new MutableTestSystemClock(now);
        await using var host = await StartHostAsync(database.ConnectionString, clock);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp11-expired-before-purge",
            createdAtUtc: now.AddHours(-1),
            expiresAtUtc: now.AddMinutes(1));
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp11-expired-before-purge.local", "checkpoint-11-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        clock.Advance(TimeSpan.FromMinutes(2));

        using var expiredRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, PaperBinderTenantLeaseRoutes.LeasePath);
        var expiredResponse = await host.Client.SendAsync(expiredRequest);
        var expiredProblem = await expiredResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Gone, expiredResponse.StatusCode);
        AssertApiProtocolHeaders(expiredResponse);
        Assert.NotNull(expiredProblem);
        Assert.Equal(TenantExpiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(expiredProblem!, "errorCode"));

        var cleanupResult = await RunCleanupCycleAsync(host);
        Assert.Equal(1, cleanupResult.SelectedTenantCount);
        Assert.Equal(1, cleanupResult.PurgedTenantCount);

        using var purgedRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, PaperBinderTenantLeaseRoutes.LeasePath);
        var purgedResponse = await host.Client.SendAsync(purgedRequest);
        var purgedProblem = await purgedResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, purgedResponse.StatusCode);
        AssertApiProtocolHeaders(purgedResponse);
        Assert.NotNull(purgedProblem);
        Assert.Equal(TenantNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(purgedProblem!, "errorCode"));
    }

    private static async Task<PaperBinderApplicationHost> StartHostAsync(
        string databaseConnection,
        MutableTestSystemClock clock,
        IReadOnlyDictionary<string, string?>? configurationOverrides = null) =>
        await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            databaseConnection,
            configurationOverrides,
            configureServices: services => TenantResolutionIntegrationTestHost.ReplaceSystemClock(services, clock));

    private static HttpRequestMessage CreateTenantApiRequest(
        HttpMethod method,
        SeededTenant tenant,
        AuthenticatedSession session,
        string path,
        object? body = null,
        string? csrfToken = null)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Host = $"{tenant.Slug}.paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        if (csrfToken is not null)
        {
            request.Headers.Add(CsrfHeaderName, csrfToken);
        }

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return request;
    }

    private static void AssertApiProtocolHeaders(HttpResponseMessage response)
    {
        Assert.Equal(CurrentApiVersion, TenantResolutionIntegrationTestHost.GetRequiredHeader(response, ApiVersionHeader));

        var correlationId = TenantResolutionIntegrationTestHost.GetRequiredHeader(response, CorrelationIdHeader);
        Assert.True(
            !string.IsNullOrWhiteSpace(correlationId) &&
            Regex.IsMatch(correlationId, "^[A-Za-z0-9-]{1,64}$"),
            $"Expected a correlation id header value, but got `{correlationId}`.");
    }

    private static async Task<TenantLeaseCleanupCycleResult> RunCleanupCycleAsync(PaperBinderApplicationHost host)
    {
        using var scope = host.Application.Services.CreateScope();
        var cleanupService = scope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>();
        return await cleanupService.RunCleanupCycleAsync();
    }

    private static async Task<TenantLeaseRow?> GetTenantLeaseRowAsync(
        PaperBinderApplicationHost host,
        Guid tenantId)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();

        return await connection.QuerySingleOrDefaultAsync<TenantLeaseRow>(
            """
            select
                expires_at_utc as ExpiresAtUtc,
                lease_extension_count as ExtensionCount
            from tenants
            where id = @TenantId;
            """,
            new { TenantId = tenantId });
    }

    private static async Task<TenantOwnedRowCounts> GetTenantOwnedRowCountsAsync(
        PaperBinderApplicationHost host,
        Guid tenantId,
        Guid userId,
        Guid binderId,
        Guid documentId)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();

        return await connection.QuerySingleAsync<TenantOwnedRowCounts>(
            """
            select
                (select count(*) from tenants where id = @TenantId) as TenantCount,
                (select count(*) from user_tenants where tenant_id = @TenantId) as MembershipCount,
                (select count(*) from users where id = @UserId) as UserCount,
                (select count(*) from binders where id = @BinderId and tenant_id = @TenantId) as BinderCount,
                (select count(*) from binder_policies where binder_id = @BinderId and tenant_id = @TenantId) as BinderPolicyCount,
                (select count(*) from documents where id = @DocumentId and tenant_id = @TenantId) as DocumentCount;
            """,
            new
            {
                TenantId = tenantId,
                UserId = userId,
                BinderId = binderId,
                DocumentId = documentId
            });
    }

    private sealed record TenantLeasePayload(
        [property: JsonPropertyName("expiresAt")] DateTimeOffset ExpiresAt,
        [property: JsonPropertyName("secondsRemaining")] int SecondsRemaining,
        [property: JsonPropertyName("extensionCount")] int ExtensionCount,
        [property: JsonPropertyName("maxExtensions")] int MaxExtensions,
        [property: JsonPropertyName("canExtend")] bool CanExtend);

    private sealed class TenantLeaseRow
    {
        public DateTimeOffset ExpiresAtUtc { get; init; }

        public int ExtensionCount { get; init; }
    }

    private sealed class TenantOwnedRowCounts
    {
        public long TenantCount { get; init; }

        public long MembershipCount { get; init; }

        public long UserCount { get; init; }

        public long BinderCount { get; init; }

        public long BinderPolicyCount { get; init; }

        public long DocumentCount { get; init; }
    }
}
