using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class BinderDomainAndPolicyModelIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string CurrentApiVersion = "1";
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string BinderNotFoundErrorCode = "BINDER_NOT_FOUND";
    private const string BinderPolicyDeniedErrorCode = "BINDER_POLICY_DENIED";
    private const string BinderPolicyInvalidErrorCode = "BINDER_POLICY_INVALID";

    [Fact]
    public async Task Should_CreateBinder_AndExposeDefaultInheritPolicy_When_RequestIsValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-create-binder");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp9-create-binder.local", "checkpoint-9-password");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp9-create-binder.local", "checkpoint-9-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var writerSession = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var createRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            writerSession,
            "/api/binders",
            body: new { name = "Executive Policies" },
            csrfToken: writerSession.CsrfCookieValue);

        var createResponse = await host.Client.SendAsync(createRequest);
        var createdBinder = await createResponse.Content.ReadFromJsonAsync<BinderSummaryPayload>();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        AssertApiProtocolHeaders(createResponse);
        Assert.NotNull(createdBinder);
        Assert.Equal("Executive Policies", createdBinder!.Name);

        var adminSession = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var policyRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            adminSession,
            $"/api/binders/{createdBinder.BinderId:D}/policy");

        var policyResponse = await host.Client.SendAsync(policyRequest);
        var policyPayload = await policyResponse.Content.ReadFromJsonAsync<BinderPolicyPayload>();

        Assert.Equal(HttpStatusCode.OK, policyResponse.StatusCode);
        AssertApiProtocolHeaders(policyResponse);
        Assert.NotNull(policyPayload);
        Assert.Equal(BinderPolicyModeNames.Inherit, policyPayload!.Mode);
        Assert.Empty(policyPayload.AllowedRoles);
    }

    [Fact]
    public async Task Should_ListOnlyCurrentTenantBinders_AndOmitRestrictedBinders_When_CallerLacksAllowedRole()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-list-binders");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-list-binders-other");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-list-binders.local", "checkpoint-9-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "General Binder");
        await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Reader Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderRead]);
        await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Writer Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderWrite]);
        await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Admin Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.TenantAdmin]);
        await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, otherTenant, "Other Tenant Binder");

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/binders");

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<ListBindersResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);

        var binderNames = payload!.Binders
            .Select(binder => binder.Name)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(["General Binder", "Reader Binder"], binderNames);
    }

    [Fact]
    public async Task Should_ReturnExplicitEmptyDocuments_When_BinderDetailIsAllowed()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-detail-allowed");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-detail-allowed.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Detail Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/binders/{binder.Id:D}");

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<BinderDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);
        Assert.Equal(binder.Id, payload!.BinderId);
        Assert.Equal("Detail Binder", payload.Name);
        Assert.Empty(payload.Documents);
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_BinderPolicyDeniesSameTenantCaller()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-detail-denied");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-detail-denied.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Writer Only Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderWrite]);

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/binders/{binder.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderPolicyDeniedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_BinderIdBelongsToAnotherTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-cross-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-cross-tenant-b");
        var otherTenantUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-cross-tenant-b.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, otherTenantUser, otherTenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Tenant A Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, otherTenantUser.Email, otherTenantUser.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, otherTenant, session, $"/api/binders/{binder.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RequireTenantAdmin_ForBinderPolicyEndpoints()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-policy-admin");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp9-policy-admin.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Policy Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);

        using var readRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/binders/{binder.Id:D}/policy");
        using var updateRequest = CreateTenantApiRequest(
            HttpMethod.Put,
            tenant,
            session,
            $"/api/binders/{binder.Id:D}/policy",
            body: new
            {
                mode = BinderPolicyModeNames.RestrictedRoles,
                allowedRoles = new[] { nameof(TenantRole.BinderWrite) }
            },
            csrfToken: session.CsrfCookieValue);

        var readResponse = await host.Client.SendAsync(readRequest);
        var updateResponse = await host.Client.SendAsync(updateRequest);

        Assert.Equal(HttpStatusCode.Forbidden, readResponse.StatusCode);
        AssertApiProtocolHeaders(readResponse);
        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);
        AssertApiProtocolHeaders(updateResponse);
    }

    [Fact]
    public async Task Should_ReturnUnprocessableEntity_When_BinderPolicyPayloadIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-policy-invalid");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp9-policy-invalid.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Invalid Policy Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Put,
            tenant,
            session,
            $"/api/binders/{binder.Id:D}/policy",
            body: new
            {
                mode = BinderPolicyModeNames.RestrictedRoles,
                allowedRoles = new[] { "Nope" }
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderPolicyInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_UpdateBinderPolicy_Idempotently_AndApplyListOmissionSemantics()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-policy-update");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp9-policy-update.local", "checkpoint-9-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-policy-update.local", "checkpoint-9-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Managed Binder");
        var adminSession = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);

        using var firstUpdateRequest = CreateTenantApiRequest(
            HttpMethod.Put,
            tenant,
            adminSession,
            $"/api/binders/{binder.Id:D}/policy",
            body: new
            {
                mode = BinderPolicyModeNames.RestrictedRoles,
                allowedRoles = new[] { nameof(TenantRole.TenantAdmin) }
            },
            csrfToken: adminSession.CsrfCookieValue);

        var firstUpdateResponse = await host.Client.SendAsync(firstUpdateRequest);
        var firstPolicy = await firstUpdateResponse.Content.ReadFromJsonAsync<BinderPolicyPayload>();

        Assert.Equal(HttpStatusCode.OK, firstUpdateResponse.StatusCode);
        AssertApiProtocolHeaders(firstUpdateResponse);
        Assert.NotNull(firstPolicy);
        Assert.Equal(BinderPolicyModeNames.RestrictedRoles, firstPolicy!.Mode);
        Assert.Equal([nameof(TenantRole.TenantAdmin)], firstPolicy.AllowedRoles);

        using var secondUpdateRequest = CreateTenantApiRequest(
            HttpMethod.Put,
            tenant,
            adminSession,
            $"/api/binders/{binder.Id:D}/policy",
            body: new
            {
                mode = BinderPolicyModeNames.RestrictedRoles,
                allowedRoles = new[] { nameof(TenantRole.TenantAdmin) }
            },
            csrfToken: adminSession.CsrfCookieValue);

        var secondUpdateResponse = await host.Client.SendAsync(secondUpdateRequest);
        var secondPolicy = await secondUpdateResponse.Content.ReadFromJsonAsync<BinderPolicyPayload>();

        Assert.Equal(HttpStatusCode.OK, secondUpdateResponse.StatusCode);
        AssertApiProtocolHeaders(secondUpdateResponse);
        Assert.NotNull(secondPolicy);
        Assert.Equal(firstPolicy.Mode, secondPolicy!.Mode);
        Assert.Equal(firstPolicy.AllowedRoles, secondPolicy.AllowedRoles);

        var readerSession = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var readerListRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, readerSession, "/api/binders");
        var readerListResponse = await host.Client.SendAsync(readerListRequest);
        var readerListPayload = await readerListResponse.Content.ReadFromJsonAsync<ListBindersResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, readerListResponse.StatusCode);
        AssertApiProtocolHeaders(readerListResponse);
        Assert.NotNull(readerListPayload);
        Assert.Empty(readerListPayload!.Binders);
    }

    [Fact]
    public async Task Should_RejectBinderCreate_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-create-csrf");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp9-create-csrf.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/binders",
            body: new { name = "Missing CSRF Binder" });

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectBinderPolicyUpdate_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-update-csrf");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp9-update-csrf.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "CSRF Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Put,
            tenant,
            session,
            $"/api/binders/{binder.Id:D}/policy",
            body: new
            {
                mode = BinderPolicyModeNames.RestrictedRoles,
                allowedRoles = new[] { nameof(TenantRole.TenantAdmin) }
            });

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RootHostRequestsBinderEndpoint()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp9-root-host");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp9-root-host.local", "checkpoint-9-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/binders");
        request.Headers.Host = "paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        AssertApiProtocolHeaders(response);
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

    private static void AssertApiProtocolHeaders(HttpResponseMessage response)
    {
        Assert.Equal(CurrentApiVersion, TenantResolutionIntegrationTestHost.GetRequiredHeader(response, ApiVersionHeader));

        var correlationId = TenantResolutionIntegrationTestHost.GetRequiredHeader(response, CorrelationIdHeader);
        Assert.True(
            !string.IsNullOrWhiteSpace(correlationId) &&
            Regex.IsMatch(correlationId, "^[A-Za-z0-9-]{1,64}$"),
            $"Expected a correlation id header value, but got `{correlationId}`.");
    }

    private sealed record ListBindersResponsePayload(
        [property: JsonPropertyName("binders")] IReadOnlyList<BinderSummaryPayload> Binders);

    private sealed record BinderSummaryPayload(
        [property: JsonPropertyName("binderId")] Guid BinderId,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt);

    private sealed record BinderDetailPayload(
        [property: JsonPropertyName("binderId")] Guid BinderId,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
        [property: JsonPropertyName("documents")] IReadOnlyList<object> Documents);

    private sealed record BinderPolicyPayload(
        [property: JsonPropertyName("mode")] string Mode,
        [property: JsonPropertyName("allowedRoles")] IReadOnlyList<string> AllowedRoles);
}
