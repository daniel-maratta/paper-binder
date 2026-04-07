using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using PaperBinder.Api;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests(PostgresContainerFixture postgres)
{
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string TenantUserNotFoundErrorCode = "TENANT_USER_NOT_FOUND";
    private const string TenantUserEmailConflictErrorCode = "TENANT_USER_EMAIL_CONFLICT";
    private const string LastTenantAdminRequiredErrorCode = "LAST_TENANT_ADMIN_REQUIRED";
    private const string TenantRoleInvalidErrorCode = "TENANT_ROLE_INVALID";
    private const string TenantUserPasswordInvalidErrorCode = "TENANT_USER_PASSWORD_INVALID";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string TenantForbiddenErrorCode = "TENANT_FORBIDDEN";

    [Fact]
    public async Task Should_ListOnlyCurrentTenantUsers_When_CallerIsTenantAdmin()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-list-users");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-list-users-other");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-list-users.local", "checkpoint-8-password");
        var member = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp8-list-users.local", "checkpoint-8-password");
        var otherTenantUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-list-users-other.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, member, tenant, TenantRole.BinderRead, isOwner: false);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, otherTenantUser, otherTenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/tenant/users");

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<ListTenantUsersResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Collection(
            payload!.Users.OrderBy(user => user.Email, StringComparer.OrdinalIgnoreCase),
            user =>
            {
                Assert.Equal(admin.Id, user.UserId);
                Assert.Equal(admin.Email, user.Email);
                Assert.Equal(nameof(TenantRole.TenantAdmin), user.Role);
                Assert.True(user.IsOwner);
            },
            user =>
            {
                Assert.Equal(member.Id, user.UserId);
                Assert.Equal(member.Email, user.Email);
                Assert.Equal(nameof(TenantRole.BinderRead), user.Role);
                Assert.False(user.IsOwner);
            });
        Assert.DoesNotContain(payload.Users, user => user.UserId == otherTenantUser.Id);
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_NonAdminRequestsTenantUserRoute()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-non-admin");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-non-admin.local", "checkpoint-8-password");
        var member = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp8-non-admin.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, member, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, member.Email, member.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/tenant/users");

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RootHostRequestsTenantUserRoute()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-root-host");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-root-host.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/tenant/users");
        request.Headers.Host = "paperbinder.localhost";
        request.Headers.Add("Cookie", session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_CreateTenantUser_AndAllowLogin_When_RequestIsValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-create-user");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-create-user.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var adminSession = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var createRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            adminSession,
            "/api/tenant/users",
            body: new
            {
                email = "writer@cp8-create-user.local",
                password = "new-user-password",
                role = nameof(TenantRole.BinderWrite)
            },
            csrfToken: adminSession.CsrfCookieValue);

        var createResponse = await host.Client.SendAsync(createRequest);
        var createdUser = await createResponse.Content.ReadFromJsonAsync<TenantUserPayload>();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(createdUser);
        Assert.Equal("writer@cp8-create-user.local", createdUser!.Email);
        Assert.Equal(nameof(TenantRole.BinderWrite), createdUser.Role);
        Assert.False(createdUser.IsOwner);

        var newUserSession = await AuthIntegrationTestClient.LoginAsync(host, createdUser.Email, "new-user-password");
        Assert.Equal($"http://{tenant.Slug}.paperbinder.localhost:8080/app", newUserSession.LoginPayload!.RedirectUrl);

        using var probeRequest = CreateTenantApiRequest(
            HttpMethod.Get,
            tenant,
            newUserSession,
            "/api/__tests/policies/binder-write");

        var probeResponse = await host.Client.SendAsync(probeRequest);

        Assert.Equal(HttpStatusCode.OK, probeResponse.StatusCode);
    }

    [Fact]
    public async Task Should_ReturnConflict_When_TenantUserEmailAlreadyExists()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-email-conflict");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-email-conflict.local", "checkpoint-8-password");
        var existingUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "existing@cp8-email-conflict.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, existingUser, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/users",
            body: new
            {
                email = existingUser.Email,
                password = "another-password",
                role = nameof(TenantRole.BinderRead)
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantUserEmailConflictErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnBadRequest_When_TenantUserEmailIsStructurallyInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-invalid-email");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-invalid-email.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/users",
            body: new
            {
                email = "not-an-email",
                password = "valid-password",
                role = nameof(TenantRole.BinderRead)
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("Tenant user email invalid.", problem!.Title);
    }

    [Fact]
    public async Task Should_ReturnUnprocessableEntity_When_TenantUserRoleIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-invalid-role");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-invalid-role.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/users",
            body: new
            {
                email = "invalid-role@cp8.local",
                password = "valid-password",
                role = "Nope"
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantRoleInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnUnprocessableEntity_When_TenantUserPasswordIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-invalid-password");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-invalid-password.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/users",
            body: new
            {
                email = "invalid-password@cp8.local",
                password = "short",
                role = nameof(TenantRole.BinderRead)
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantUserPasswordInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectTenantUserCreate_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-create-csrf-missing");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-create-csrf-missing.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/tenant/users",
            body: new
            {
                email = "missing-csrf@cp8.local",
                password = "valid-password",
                role = nameof(TenantRole.BinderRead)
            });

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectTenantUserRoleChange_When_CsrfTokenIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-role-csrf-invalid");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-role-csrf-invalid.local", "checkpoint-8-password");
        var targetUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "target@cp8-role-csrf-invalid.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, targetUser, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/tenant/users/{targetUser.Id:D}/role",
            body: new { role = nameof(TenantRole.BinderWrite) },
            csrfToken: "invalid-token");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ChangeTenantUserRole_When_TargetBelongsToCurrentTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-role-change");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-role-change.local", "checkpoint-8-password");
        var targetUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "target@cp8-role-change.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, targetUser, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/tenant/users/{targetUser.Id:D}/role",
            body: new { role = nameof(TenantRole.BinderWrite) },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantUserPayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(targetUser.Id, payload!.UserId);
        Assert.Equal(nameof(TenantRole.BinderWrite), payload.Role);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RoleChangeTargetsUserOutsideCurrentTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-role-not-found");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-role-not-found-other");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-role-not-found.local", "checkpoint-8-password");
        var otherTenantUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "target@cp8-role-not-found-other.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, otherTenantUser, otherTenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/tenant/users/{otherTenantUser.Id:D}/role",
            body: new { role = nameof(TenantRole.BinderWrite) },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantUserNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnConflict_When_RequestWouldDemoteLastTenantAdmin()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-last-admin");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "owner@cp8-last-admin.local", "checkpoint-8-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/tenant/users/{admin.Id:D}/role",
            body: new { role = nameof(TenantRole.BinderRead) },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(LastTenantAdminRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ApplyRoleHierarchy_On_TestPolicyProbes()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-policy-hierarchy");
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "admin@cp8-policy-hierarchy.local", "checkpoint-8-password");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp8-policy-hierarchy.local", "checkpoint-8-password");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp8-policy-hierarchy.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var adminSession = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        var writerSession = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        var readerSession = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);

        await AssertPolicyStatusAsync(host, tenant, adminSession, "/api/__tests/policies/authenticated", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, adminSession, "/api/__tests/policies/binder-read", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, adminSession, "/api/__tests/policies/binder-write", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, adminSession, "/api/__tests/policies/tenant-admin", HttpStatusCode.OK);

        await AssertPolicyStatusAsync(host, tenant, writerSession, "/api/__tests/policies/authenticated", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, writerSession, "/api/__tests/policies/binder-read", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, writerSession, "/api/__tests/policies/binder-write", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, writerSession, "/api/__tests/policies/tenant-admin", HttpStatusCode.Forbidden);

        await AssertPolicyStatusAsync(host, tenant, readerSession, "/api/__tests/policies/authenticated", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, readerSession, "/api/__tests/policies/binder-read", HttpStatusCode.OK);
        await AssertPolicyStatusAsync(host, tenant, readerSession, "/api/__tests/policies/binder-write", HttpStatusCode.Forbidden);
        await AssertPolicyStatusAsync(host, tenant, readerSession, "/api/__tests/policies/tenant-admin", HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Should_RejectTestPolicyProbe_When_AuthenticatedUserTargetsDifferentTenantHost()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-policy-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-policy-tenant-b");
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp8-policy-tenant-a.local", "checkpoint-8-password");

        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Get,
            otherTenant,
            session,
            "/api/__tests/policies/binder-read");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantForbiddenErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    private static async Task<PaperBinderApplicationHost> StartHostAsync(string databaseConnection) =>
        await TenantResolutionIntegrationTestHost.StartDockerHostAsync(
            databaseConnection,
            additionalConfigureBeforeStart: ConfigurePolicyProbes);

    private static void ConfigurePolicyProbes(WebApplication app)
    {
        var probes = app.MapGroup("/api/__tests/policies")
            .RequirePaperBinderTenantHost();

        probes.MapGet("/authenticated", () => Results.Ok(new PolicyProbeResponse(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.AuthenticatedUser);
        probes.MapGet("/binder-read", () => Results.Ok(new PolicyProbeResponse(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderRead);
        probes.MapGet("/binder-write", () => Results.Ok(new PolicyProbeResponse(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.BinderWrite);
        probes.MapGet("/tenant-admin", () => Results.Ok(new PolicyProbeResponse(true)))
            .RequireAuthorization(PaperBinderAuthorizationPolicyNames.TenantAdmin);
    }

    private static async Task AssertPolicyStatusAsync(
        PaperBinderApplicationHost host,
        SeededTenant tenant,
        AuthenticatedSession session,
        string path,
        HttpStatusCode expectedStatus)
    {
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, path);
        using var response = await host.Client.SendAsync(request);

        Assert.Equal(expectedStatus, response.StatusCode);
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

    private sealed record PolicyProbeResponse(bool Allowed);

    private sealed record ListTenantUsersResponsePayload(
        [property: JsonPropertyName("users")] IReadOnlyList<TenantUserPayload> Users);

    private sealed record TenantUserPayload(
        [property: JsonPropertyName("userId")] Guid UserId,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("isOwner")] bool IsOwner);
}
