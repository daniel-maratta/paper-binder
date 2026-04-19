using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PaperBinder.Api;
using PaperBinder.Application.Tenancy;
using PaperBinder.Infrastructure.Configuration;
using PaperBinder.Infrastructure.Diagnostics;
using PaperBinder.Worker;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class HardeningConsistencyIntegrationTests(PostgresContainerFixture postgres)
{
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string RateLimitedErrorCode = "RATE_LIMITED";

    [Fact]
    public async Task Should_ReturnTooManyRequests_When_AuthenticatedTenantHostMutationRateLimitBudgetIsExceeded()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-auth-mutation-rate-limit");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-auth-mutation-rate-limit.local", "checkpoint-16-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var firstRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "First Binder" },
            csrfToken: session.CsrfCookieValue);
        var firstResponse = await host.Client.SendAsync(firstRequest);

        using var secondRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "Second Binder" },
            csrfToken: session.CsrfCookieValue);
        var secondResponse = await host.Client.SendAsync(secondRequest);
        var problem = await secondResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, secondResponse.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(RateLimitedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
        Assert.True(secondResponse.Headers.TryGetValues("Retry-After", out var retryAfterValues));
        Assert.False(string.IsNullOrWhiteSpace(Assert.Single(retryAfterValues)));
    }

    [Fact]
    public async Task Should_RejectAuthenticatedTenantMutationForMissingCsrf_WithoutChargingAuthenticatedRateLimitBudget()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-auth-mutation-csrf");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-auth-mutation-csrf.local", "checkpoint-16-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var missingCsrfRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "Missing Csrf Binder" });
        var missingCsrfResponse = await host.Client.SendAsync(missingCsrfRequest);
        var missingCsrfProblem = await missingCsrfResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        using var succeedingRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "Charged After Valid Csrf" },
            csrfToken: session.CsrfCookieValue);
        var succeedingResponse = await host.Client.SendAsync(succeedingRequest);

        Assert.Equal(HttpStatusCode.Forbidden, missingCsrfResponse.StatusCode);
        Assert.NotNull(missingCsrfProblem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(missingCsrfProblem!, "errorCode"));
        Assert.Equal(HttpStatusCode.Created, succeedingResponse.StatusCode);
    }

    [Fact]
    public async Task Should_AllowLogout_When_AuthenticatedMutationBudgetIsExhausted()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-logout-exempt");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-logout-exempt.local", "checkpoint-16-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var mutationRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "Exhaust Budget" },
            csrfToken: session.CsrfCookieValue);
        var mutationResponse = await host.Client.SendAsync(mutationRequest);

        using var logoutRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/auth/logout",
            body: new { },
            csrfToken: session.CsrfCookieValue);
        var logoutResponse = await host.Client.SendAsync(logoutRequest);
        var payload = await logoutResponse.Content.ReadFromJsonAsync<LogoutResponsePayload>();

        Assert.Equal(HttpStatusCode.Created, mutationResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal("http://paperbinder.localhost:8080/login", payload!.RedirectUrl);
    }

    [Fact]
    public async Task Should_AllowImpersonationStop_When_AuthenticatedMutationBudgetIsExhausted()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "1"
            });

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-impersonation-stop-exempt");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-impersonation-stop-exempt.local", "checkpoint-16-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp16-impersonation-stop-exempt.local", "checkpoint-16-password");

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
        var impersonatedSession = ApplyResponseCookies(session, startResponse);

        using var stopRequest = CreateTenantApiRequest(
            HttpMethod.Delete,
            tenant,
            impersonatedSession,
            "/api/tenant/impersonation",
            body: new { },
            csrfToken: impersonatedSession.CsrfCookieValue);
        var stopResponse = await host.Client.SendAsync(stopRequest);
        var payload = await stopResponse.Content.ReadFromJsonAsync<TenantImpersonationStatusPayload>();

        Assert.Equal(HttpStatusCode.OK, startResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, stopResponse.StatusCode);
        Assert.NotNull(payload);
        Assert.False(payload!.IsImpersonating);
        Assert.Equal(admin.Id, payload.Effective.UserId);
    }

    [Fact]
    public async Task Should_EmitCorrelatedTraceContext_For_ApiRequests_DatabaseCalls_And_WorkerCleanup()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-traces");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-traces.local", "checkpoint-16-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var activityCapture = new ActivityCapture();
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/binders");
        using var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await response.Content.ReadAsStringAsync();

        var requestActivity = Assert.Single(
            activityCapture.Activities,
            activity => activity.Kind == ActivityKind.Server);
        var dbConnectionActivities = activityCapture.Activities
            .Where(activity => string.Equals(
                activity.OperationName,
                PaperBinderTelemetry.ActivityNames.DatabaseConnectionOpen,
                StringComparison.Ordinal))
            .ToArray();

        Assert.NotEmpty(dbConnectionActivities);
        Assert.Equal(tenant.Id.ToString("D"), GetRequiredTag(requestActivity, PaperBinderTelemetry.ActivityTags.TenantId));
        Assert.Equal(admin.Id.ToString("D"), GetRequiredTag(requestActivity, PaperBinderTelemetry.ActivityTags.UserId));
        Assert.All(
            dbConnectionActivities,
            activity =>
            {
                Assert.Equal(requestActivity.TraceId, activity.TraceId);
                Assert.Equal("postgresql", GetRequiredTag(activity, "db.system"));
            });

        var cleanupProbe = new WorkerCleanupProbe();
        using var workerHost = PaperBinderWorkerHostBuilder.BuildHost(
            Array.Empty<string>(),
            "Test",
            TestRuntimeConfiguration.Create("Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder;Password=test-password"),
            services =>
            {
                services.AddSingleton(cleanupProbe);
                services.AddScoped<ITenantLeaseCleanupService, ProbeTenantLeaseCleanupService>();
            });

        await workerHost.StartAsync();
        await cleanupProbe.WaitForCycleAsync(TimeSpan.FromSeconds(10));
        await workerHost.StopAsync();

        var workerActivity = Assert.Single(
            activityCapture.Activities,
            activity => string.Equals(
                activity.OperationName,
                PaperBinderTelemetry.ActivityNames.WorkerCleanupCycle,
                StringComparison.Ordinal));

        Assert.Equal("worker", GetRequiredTag(workerActivity, PaperBinderTelemetry.ActivityTags.Surface));
        Assert.Equal("1", GetRequiredTag(workerActivity, PaperBinderTelemetry.ActivityTags.CleanupPurgedTenantCount));
    }

    [Fact]
    public async Task Should_RecordLockedLowCardinalityMetrics_For_SecurityDenials_RateLimitRejections_And_CleanupOutcomes()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            database.ConnectionString,
            new Dictionary<string, string?>
            {
                [PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute] = "1"
            });

        using var metricCapture = new MetricCapture();

        var activeTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp16-metrics-active");
        var expiredTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(
            host,
            "cp16-metrics-expired",
            createdAtUtc: DateTimeOffset.UtcNow.AddHours(-1),
            expiresAtUtc: DateTimeOffset.UtcNow.AddMinutes(-1));
        var activeAdmin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-metrics-active.local", "checkpoint-16-password");
        var expiredAdmin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp16-metrics-expired.local", "checkpoint-16-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, activeAdmin, activeTenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, expiredAdmin, expiredTenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, activeAdmin.Email, activeAdmin.Password);

        using var missingCsrfRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            activeTenant,
            session,
            "/api/binders",
            body: new { name = "Missing Csrf" });
        var missingCsrfResponse = await host.Client.SendAsync(missingCsrfRequest);

        using var firstMutation = CreateTenantApiRequest(
            HttpMethod.Post,
            activeTenant,
            session,
            "/api/binders",
            body: new { name = "Within Budget" },
            csrfToken: session.CsrfCookieValue);
        var firstMutationResponse = await host.Client.SendAsync(firstMutation);

        using var secondMutation = CreateTenantApiRequest(
            HttpMethod.Post,
            activeTenant,
            session,
            "/api/binders",
            body: new { name = "Rejected By Budget" },
            csrfToken: session.CsrfCookieValue);
        var secondMutationResponse = await host.Client.SendAsync(secondMutation);

        Assert.Equal(HttpStatusCode.Forbidden, missingCsrfResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, firstMutationResponse.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, secondMutationResponse.StatusCode);

        using (var scope = host.Application.Services.CreateScope())
        {
            var cleanupService = scope.ServiceProvider.GetRequiredService<ITenantLeaseCleanupService>();
            await cleanupService.RunCleanupCycleAsync();
        }

        Assert.Contains(
            metricCapture.Measurements,
            measurement => measurement.Name == PaperBinderTelemetry.MetricNames.SecurityDenialsTotal &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Reason, out var reason) &&
                           string.Equals(reason, PaperBinderTelemetry.SecurityDenialReasons.CsrfTokenInvalid, StringComparison.Ordinal) &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Surface, out var surface) &&
                           string.Equals(surface, PaperBinderTelemetry.SecurityDenialSurfaces.Csrf, StringComparison.Ordinal));

        Assert.Contains(
            metricCapture.Measurements,
            measurement => measurement.Name == PaperBinderTelemetry.MetricNames.RateLimitRejectionsTotal &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Policy, out var policy) &&
                           string.Equals(policy, PaperBinderTelemetry.RateLimitPolicies.AuthenticatedTenantMutation, StringComparison.Ordinal) &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Surface, out var surface) &&
                           string.Equals(surface, PaperBinderTelemetry.RateLimitSurfaces.TenantHost, StringComparison.Ordinal));

        Assert.Contains(
            metricCapture.Measurements,
            measurement => measurement.Name == PaperBinderTelemetry.MetricNames.CleanupCyclesTotal &&
                           measurement.Value == 1 &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Result, out var result) &&
                           string.Equals(result, PaperBinderTelemetry.CleanupResults.Completed, StringComparison.Ordinal));

        Assert.Contains(
            metricCapture.Measurements,
            measurement => measurement.Name == PaperBinderTelemetry.MetricNames.CleanupTenantsTotal &&
                           measurement.Value == 1 &&
                           measurement.Tags.TryGetValue(PaperBinderTelemetry.MetricTagKeys.Result, out var result) &&
                           string.Equals(result, PaperBinderTelemetry.CleanupResults.Purged, StringComparison.Ordinal));

        foreach (var measurement in metricCapture.Measurements)
        {
            AssertAllowedMetricTags(measurement);
        }
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

    private static string GetRequiredTag(Activity activity, string key)
    {
        var value = activity.GetTagItem(key)?.ToString();
        Assert.False(string.IsNullOrWhiteSpace(value));
        return value!;
    }

    private static void AssertAllowedMetricTags(MetricMeasurement measurement)
    {
        var expectedKeys = measurement.Name switch
        {
            PaperBinderTelemetry.MetricNames.SecurityDenialsTotal => new[]
            {
                PaperBinderTelemetry.MetricTagKeys.Reason,
                PaperBinderTelemetry.MetricTagKeys.Surface
            },
            PaperBinderTelemetry.MetricNames.RateLimitRejectionsTotal => new[]
            {
                PaperBinderTelemetry.MetricTagKeys.Policy,
                PaperBinderTelemetry.MetricTagKeys.Surface
            },
            PaperBinderTelemetry.MetricNames.CleanupCyclesTotal => new[]
            {
                PaperBinderTelemetry.MetricTagKeys.Result
            },
            PaperBinderTelemetry.MetricNames.CleanupTenantsTotal => new[]
            {
                PaperBinderTelemetry.MetricTagKeys.Result
            },
            _ => throw new Xunit.Sdk.XunitException($"Unexpected metric `{measurement.Name}` was captured.")
        };

        Assert.Equal(
            expectedKeys.Order(StringComparer.Ordinal),
            measurement.Tags.Keys.Order(StringComparer.Ordinal));
    }

    private sealed record TenantImpersonationStatusPayload(
        bool IsImpersonating,
        TenantImpersonationUserPayload Actor,
        TenantImpersonationUserPayload Effective);

    private sealed record TenantImpersonationUserPayload(
        Guid UserId,
        string Email,
        string Role);

    private sealed class ActivityCapture : IDisposable
    {
        private readonly List<Activity> activities = [];
        private readonly ActivityListener listener;

        public ActivityCapture()
        {
            listener = new ActivityListener
            {
                ShouldListenTo = source =>
                    string.Equals(source.Name, PaperBinderTelemetry.ActivitySourceName, StringComparison.Ordinal) ||
                    source.Name.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal),
                Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
                SampleUsingParentId = static (ref ActivityCreationOptions<string> _) => ActivitySamplingResult.AllDataAndRecorded,
                ActivityStopped = activity =>
                {
                    lock (activities)
                    {
                        activities.Add(activity);
                    }
                }
            };

            ActivitySource.AddActivityListener(listener);
        }

        public IReadOnlyList<Activity> Activities
        {
            get
            {
                lock (activities)
                {
                    return activities.ToArray();
                }
            }
        }

        public void Dispose() => listener.Dispose();
    }

    private sealed class MetricCapture : IDisposable
    {
        private readonly List<MetricMeasurement> measurements = [];
        private readonly MeterListener listener = new();

        public MetricCapture()
        {
            listener.InstrumentPublished = (instrument, meterListener) =>
            {
                if (string.Equals(instrument.Meter.Name, PaperBinderTelemetry.MeterName, StringComparison.Ordinal))
                {
                    meterListener.EnableMeasurementEvents(instrument);
                }
            };

            listener.SetMeasurementEventCallback<long>((instrument, measurement, tags, _) =>
            {
                var copiedTags = new Dictionary<string, string?>(StringComparer.Ordinal);
                foreach (var tag in tags)
                {
                    copiedTags[tag.Key] = tag.Value?.ToString();
                }

                lock (measurements)
                {
                    measurements.Add(new MetricMeasurement(instrument.Name, measurement, copiedTags));
                }
            });

            listener.Start();
        }

        public IReadOnlyList<MetricMeasurement> Measurements
        {
            get
            {
                lock (measurements)
                {
                    return measurements.ToArray();
                }
            }
        }

        public void Dispose() => listener.Dispose();
    }

    private sealed record MetricMeasurement(
        string Name,
        long Value,
        IReadOnlyDictionary<string, string?> Tags);

    private sealed class WorkerCleanupProbe
    {
        private readonly TaskCompletionSource<bool> cycleCompleted = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public void MarkCompleted() => cycleCompleted.TrySetResult(true);

        public async Task WaitForCycleAsync(TimeSpan timeout)
        {
            using var cancellationTokenSource = new CancellationTokenSource(timeout);
            await cycleCompleted.Task.WaitAsync(cancellationTokenSource.Token);
        }
    }

    private sealed class ProbeTenantLeaseCleanupService(WorkerCleanupProbe cleanupProbe) : ITenantLeaseCleanupService
    {
        public Task<TenantLeaseCleanupCycleResult> RunCleanupCycleAsync(CancellationToken cancellationToken = default)
        {
            cleanupProbe.MarkCompleted();
            return Task.FromResult(new TenantLeaseCleanupCycleResult(1, 1, 0, 0));
        }
    }
}
