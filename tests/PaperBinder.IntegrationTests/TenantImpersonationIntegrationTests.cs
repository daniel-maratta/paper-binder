using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Dapper;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Api;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class TenantImpersonationIntegrationTests(PostgresContainerFixture postgres)
{
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string TenantImpersonationTargetNotFoundErrorCode = "TENANT_IMPERSONATION_TARGET_NOT_FOUND";
    private const string TenantImpersonationSelfTargetRejectedErrorCode = "TENANT_IMPERSONATION_SELF_TARGET_REJECTED";
    private const string TenantImpersonationAlreadyActiveErrorCode = "TENANT_IMPERSONATION_ALREADY_ACTIVE";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";

    [Fact]
    public async Task Should_StartTenantLocalImpersonation_AndApplyEffectiveAuthorization_When_TenantAdminTargetsSameTenantUser()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-start-success");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-start-success.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-start-success.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var startRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/impersonation",
            body: new { userId = reader.Id },
            csrfToken: session.CsrfCookieValue);

        var startResponse = await host.Client.SendAsync(startRequest);
        var payload = await startResponse.Content.ReadFromJsonAsync<TenantImpersonationStatusPayload>();

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        Assert.NotNull(payload);
        Assert.True(payload!.IsImpersonating);
        Assert.Equal(admin.Id, payload.Actor.UserId);
        Assert.Equal(nameof(TenantRole.TenantAdmin), payload.Actor.Role);
        Assert.Equal(reader.Id, payload.Effective.UserId);
        Assert.Equal(nameof(TenantRole.BinderRead), payload.Effective.Role);

        var impersonatedSession = ApplyResponseCookies(session, startResponse);

        using var executionContextRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            impersonatedSession,
            "/api/__tests/impersonation/execution-context");

        var executionContextResponse = await host.Client.SendAsync(executionContextRequest);
        var executionContext = await executionContextResponse.Content.ReadFromJsonAsync<ExecutionContextPayload>();

        Assert.Equal(HttpStatusCode.OK, executionContextResponse.StatusCode);
        Assert.NotNull(executionContext);
        Assert.Equal(admin.Id, executionContext!.ActorUserId);
        Assert.Equal(reader.Id, executionContext.EffectiveUserId);
        Assert.True(executionContext.IsImpersonated);
        Assert.Equal(nameof(TenantRole.BinderRead), executionContext.EffectiveRole);

        using var binderReadProbeRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            impersonatedSession,
            "/api/__tests/impersonation/policies/binder-read");

        var binderReadProbeResponse = await host.Client.SendAsync(binderReadProbeRequest);
        Assert.Equal(HttpStatusCode.OK, binderReadProbeResponse.StatusCode);

        using var tenantAdminProbeRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            impersonatedSession,
            "/api/__tests/impersonation/policies/tenant-admin");

        var tenantAdminProbeResponse = await host.Client.SendAsync(tenantAdminProbeRequest);
        Assert.Equal(HttpStatusCode.Forbidden, tenantAdminProbeResponse.StatusCode);

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        var startedEvent = Assert.Single(auditEvents);
        Assert.Equal("ImpersonationStarted", startedEvent.EventName);
        Assert.Equal(tenant.Id, startedEvent.TenantId);
        Assert.Equal(admin.Id, startedEvent.ActorUserId);
        Assert.Equal(reader.Id, startedEvent.EffectiveUserId);
        Assert.False(string.IsNullOrWhiteSpace(startedEvent.CorrelationId));
    }

    [Fact]
    public async Task Should_RejectImpersonation_When_TargetUserIsMissingOutsideCurrentTenantOrMatchesActor()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-start-denied");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-start-denied-other");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-start-denied.local", "checkpoint-15-password");
        var otherTenantUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-start-denied-other.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, otherTenantUser, otherTenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var crossTenantRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/impersonation",
            body: new { userId = otherTenantUser.Id },
            csrfToken: session.CsrfCookieValue);

        var crossTenantResponse = await host.Client.SendAsync(crossTenantRequest);
        var crossTenantProblem = await crossTenantResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, crossTenantResponse.StatusCode);
        Assert.NotNull(crossTenantProblem);
        Assert.Equal(
            TenantImpersonationTargetNotFoundErrorCode,
            TenantResolutionIntegrationTestHost.GetRequiredExtension(crossTenantProblem!, "errorCode"));

        using var selfTargetRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/impersonation",
            body: new { userId = admin.Id },
            csrfToken: session.CsrfCookieValue);

        var selfTargetResponse = await host.Client.SendAsync(selfTargetRequest);
        var selfTargetProblem = await selfTargetResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, selfTargetResponse.StatusCode);
        Assert.NotNull(selfTargetProblem);
        Assert.Equal(
            TenantImpersonationSelfTargetRejectedErrorCode,
            TenantResolutionIntegrationTestHost.GetRequiredExtension(selfTargetProblem!, "errorCode"));

        Assert.Empty(await GetAuditEventsAsync(host, tenant.Id));
    }

    [Fact]
    public async Task Should_RejectNestedImpersonationStart_When_SessionAlreadyImpersonates()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-start-nested");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-start-nested.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-start-nested.local", "checkpoint-15-password");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp15-start-nested.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var firstStartRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/impersonation",
            body: new { userId = reader.Id },
            csrfToken: session.CsrfCookieValue);

        var firstStartResponse = await host.Client.SendAsync(firstStartRequest);
        Assert.Equal(HttpStatusCode.OK, firstStartResponse.StatusCode);

        var impersonatedSession = ApplyResponseCookies(session, firstStartResponse);
        using var secondStartRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation",
            body: new { userId = writer.Id },
            csrfToken: impersonatedSession.CsrfCookieValue);

        var secondStartResponse = await host.Client.SendAsync(secondStartRequest);
        var secondStartProblem = await secondStartResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, secondStartResponse.StatusCode);
        Assert.NotNull(secondStartProblem);
        Assert.Equal(
            TenantImpersonationAlreadyActiveErrorCode,
            TenantResolutionIntegrationTestHost.GetRequiredExtension(secondStartProblem!, "errorCode"));

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        Assert.Single(auditEvents);
        Assert.Equal("ImpersonationStarted", auditEvents[0].EventName);
        Assert.Equal(reader.Id, auditEvents[0].EffectiveUserId);
    }

    [Fact]
    public async Task Should_StopImpersonation_When_ActiveSessionUsesDowngradedEffectiveRole()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-stop-success");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-stop-success.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-stop-success.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var impersonatedSession = await StartImpersonationAsync(host, tenant, admin, reader);

        using var stopRequest = CreateTenantApiRequest(
            HttpMethod.Delete,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation",
            body: new { },
            csrfToken: impersonatedSession.CsrfCookieValue);

        var stopResponse = await host.Client.SendAsync(stopRequest);
        var payload = await stopResponse.Content.ReadFromJsonAsync<TenantImpersonationStatusPayload>();

        Assert.Equal(HttpStatusCode.OK, stopResponse.StatusCode);
        Assert.NotNull(payload);
        Assert.False(payload!.IsImpersonating);
        Assert.Equal(admin.Id, payload.Actor.UserId);
        Assert.Equal(admin.Id, payload.Effective.UserId);

        var restoredSession = ApplyResponseCookies(impersonatedSession, stopResponse);
        using var tenantAdminProbeRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            restoredSession,
            "/api/__tests/impersonation/policies/tenant-admin");

        var tenantAdminProbeResponse = await host.Client.SendAsync(tenantAdminProbeRequest);
        Assert.Equal(HttpStatusCode.OK, tenantAdminProbeResponse.StatusCode);

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        Assert.Collection(
            auditEvents,
            auditEvent => Assert.Equal("ImpersonationStarted", auditEvent.EventName),
            auditEvent => Assert.Equal("ImpersonationEnded", auditEvent.EventName));
    }

    [Fact]
    public async Task Should_RejectStopImpersonationWithoutValidCsrfToken_When_ImpersonationIsActive()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-stop-csrf");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-stop-csrf.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-stop-csrf.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var impersonatedSession = await StartImpersonationAsync(host, tenant, admin, reader);

        using var stopRequest = CreateTenantApiRequest(
            HttpMethod.Delete,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation",
            body: new { });

        var stopResponse = await host.Client.SendAsync(stopRequest);
        var problem = await stopResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, stopResponse.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        Assert.Single(auditEvents);
        Assert.Equal("ImpersonationStarted", auditEvents[0].EventName);
    }

    [Fact]
    public async Task Should_EndImpersonationOnLogout_AndCloseAuditTrail()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-logout");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-logout.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-logout.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var impersonatedSession = await StartImpersonationAsync(host, tenant, admin, reader);

        using var logoutRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            impersonatedSession,
            "/api/auth/logout",
            body: new { },
            csrfToken: impersonatedSession.CsrfCookieValue);

        var logoutResponse = await host.Client.SendAsync(logoutRequest);
        var payload = await logoutResponse.Content.ReadFromJsonAsync<LogoutResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal("http://paperbinder.localhost:8080/login", payload!.RedirectUrl);

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        Assert.Collection(
            auditEvents,
            auditEvent => Assert.Equal("ImpersonationStarted", auditEvent.EventName),
            auditEvent => Assert.Equal("ImpersonationEnded", auditEvent.EventName));
    }

    [Fact]
    public async Task Should_EndImpersonationOnCookieExpiry_AndCloseAuditTrail()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(
            database.ConnectionString,
            configureServices: services =>
            {
                services.PostConfigure<CookieAuthenticationOptions>(
                    IdentityConstants.ApplicationScheme,
                    options =>
                    {
                        options.ExpireTimeSpan = TimeSpan.FromSeconds(1);
                        options.SlidingExpiration = false;
                    });
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-expiry");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp15-expiry.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp15-expiry.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var impersonatedSession = await StartImpersonationAsync(host, tenant, admin, reader);
        await Task.Delay(TimeSpan.FromSeconds(2));

        using var expiredRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation");

        var expiredResponse = await host.Client.SendAsync(expiredRequest);

        Assert.Equal(HttpStatusCode.Unauthorized, expiredResponse.StatusCode);

        var auditEvents = await GetAuditEventsAsync(host, tenant.Id);
        Assert.Collection(
            auditEvents,
            auditEvent => Assert.Equal("ImpersonationStarted", auditEvent.EventName),
            auditEvent => Assert.Equal("ImpersonationEnded", auditEvent.EventName));
    }

    [Theory]
    [InlineData(nameof(AuditRetentionMode.PurgeTenantAudit))]
    [InlineData(nameof(AuditRetentionMode.RetainTenantPurgedSummary))]
    public async Task Should_RemoveTenantScopedImpersonationAuditEvents_When_TenantIsPurged(string retentionMode)
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(
            database.ConnectionString,
            configurationOverrides: new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.AuditRetentionMode] = retentionMode
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp15-purge");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, $"owner+{retentionMode}@cp15-purge.local", "checkpoint-15-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, $"reader+{retentionMode}@cp15-purge.local", "checkpoint-15-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var impersonatedSession = await StartImpersonationAsync(host, tenant, admin, reader);

        using var stopRequest = CreateTenantApiRequest(
            HttpMethod.Delete,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation",
            body: new { },
            csrfToken: impersonatedSession.CsrfCookieValue);

        var stopResponse = await host.Client.SendAsync(stopRequest);
        Assert.Equal(HttpStatusCode.OK, stopResponse.StatusCode);
        Assert.Equal(2, (await GetAuditEventsAsync(host, tenant.Id)).Count);

        await TenantResolutionIntegrationTestHost.ExpireTenantAsync(host, tenant);
        var cleanupResult = await RunCleanupCycleAsync(host);

        Assert.Equal(1, cleanupResult.SelectedTenantCount);
        Assert.Equal(1, cleanupResult.PurgedTenantCount);
        Assert.Empty(await GetAuditEventsAsync(host, tenant.Id));
    }

    private static async Task<PaperBinderApplicationHost> StartHostAsync(
        string databaseConnection,
        IReadOnlyDictionary<string, string?>? configurationOverrides = null,
        Action<IServiceCollection>? configureServices = null) =>
        await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            databaseConnection,
            configurationOverrides,
            additionalConfigureBeforeStart: ConfigureImpersonationProbes,
            configureServices: configureServices);

    private static void ConfigureImpersonationProbes(WebApplication app)
    {
        var probes = app.MapGroup("/api/__tests/impersonation")
            .RequirePaperBinderTenantHost();

        probes.MapGet(
                "/execution-context",
                (
                    IRequestExecutionUserContext executionUserContext,
                    IRequestTenantMembershipContext membershipContext) =>
                    Results.Ok(
                        new ExecutionContextPayload(
                            executionUserContext.ActorUserId,
                            executionUserContext.EffectiveUserId,
                            executionUserContext.IsImpersonated,
                            executionUserContext.ImpersonationSessionId,
                            membershipContext.Membership?.Role.ToString() ?? string.Empty)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.AuthenticatedUser);

        probes.MapGet("/policies/binder-read", () => Results.Ok(new PolicyProbePayload(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);

        probes.MapGet("/policies/tenant-admin", () => Results.Ok(new PolicyProbePayload(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin);
    }

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

    private static AuthenticatedSession ApplyResponseCookies(
        AuthenticatedSession currentSession,
        HttpResponseMessage response)
    {
        var cookies = AuthIntegrationTestClient.ParseCookieValues(response);
        var authCookieValue = cookies.TryGetValue(AuthIntegrationTestClient.AuthCookieName, out var nextAuthCookieValue)
            ? nextAuthCookieValue
            : currentSession.AuthCookieValue;
        var csrfCookieValue = cookies.TryGetValue(AuthIntegrationTestClient.CsrfCookieName, out var nextCsrfCookieValue)
            ? nextCsrfCookieValue
            : currentSession.CsrfCookieValue;

        return new AuthenticatedSession(
            currentSession.LoginResponse,
            currentSession.LoginPayload,
            authCookieValue,
            csrfCookieValue);
    }

    private static async Task<AuthenticatedSession> StartImpersonationAsync(
        PaperBinderApplicationHost host,
        SeededTenant tenant,
        SeededUser admin,
        SeededUser targetUser)
    {
        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var startRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/impersonation",
            body: new { userId = targetUser.Id },
            csrfToken: session.CsrfCookieValue);

        var startResponse = await host.Client.SendAsync(startRequest);
        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);

        return ApplyResponseCookies(session, startResponse);
    }

    private static async Task<IReadOnlyList<TenantImpersonationAuditEventRow>> GetAuditEventsAsync(
        PaperBinderApplicationHost host,
        Guid tenantId)
    {
        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        await using var connection = await connectionFactory.OpenConnectionAsync();

        var auditEvents = await connection.QueryAsync<TenantImpersonationAuditEventRow>(
            """
            select
                id as Id,
                session_id as SessionId,
                event_name as EventName,
                tenant_id as TenantId,
                actor_user_id as ActorUserId,
                effective_user_id as EffectiveUserId,
                occurred_at_utc as OccurredAtUtc,
                correlation_id as CorrelationId
            from tenant_impersonation_audit_events
            where tenant_id = @TenantId
            order by occurred_at_utc, id;
            """,
            new { TenantId = tenantId });

        return auditEvents.ToArray();
    }

    private static async Task<TenantLeaseCleanupCycleResult> RunCleanupCycleAsync(PaperBinderApplicationHost host)
    {
        using var scope = host.Application.Services.CreateScope();
        var cleanupService = scope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>();
        return await cleanupService.RunCleanupCycleAsync();
    }

    private sealed record TenantImpersonationStatusPayload(
        [property: JsonPropertyName("isImpersonating")] bool IsImpersonating,
        [property: JsonPropertyName("actor")] TenantImpersonationUserPayload Actor,
        [property: JsonPropertyName("effective")] TenantImpersonationUserPayload Effective);

    private sealed record TenantImpersonationUserPayload(
        [property: JsonPropertyName("userId")] Guid UserId,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("role")] string Role);

    private sealed record ExecutionContextPayload(
        [property: JsonPropertyName("actorUserId")] Guid ActorUserId,
        [property: JsonPropertyName("effectiveUserId")] Guid EffectiveUserId,
        [property: JsonPropertyName("isImpersonated")] bool IsImpersonated,
        [property: JsonPropertyName("impersonationSessionId")] Guid? ImpersonationSessionId,
        [property: JsonPropertyName("effectiveRole")] string EffectiveRole);

    private sealed record PolicyProbePayload(bool Allowed);

    private sealed class TenantImpersonationAuditEventRow
    {
        public Guid Id { get; init; }

        public Guid SessionId { get; init; }

        public string EventName { get; init; } = string.Empty;

        public Guid TenantId { get; init; }

        public Guid ActorUserId { get; init; }

        public Guid EffectiveUserId { get; init; }

        public DateTimeOffset OccurredAtUtc { get; init; }

        public string CorrelationId { get; init; } = string.Empty;
    }
}
