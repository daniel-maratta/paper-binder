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
    private const string DefaultPassword = "checkpoint-8-password";
    private const string TenantUsersPath = "/api/tenant/users";
    private const string AuthenticatedPolicyProbePath = "/api/__tests/policies/authenticated";
    private const string BinderReadPolicyProbePath = "/api/__tests/policies/binder-read";
    private const string BinderWritePolicyProbePath = "/api/__tests/policies/binder-write";
    private const string TenantAdminPolicyProbePath = "/api/__tests/policies/tenant-admin";
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string TenantUserNotFoundErrorCode = "TENANT_USER_NOT_FOUND";
    private const string TenantUserEmailConflictErrorCode = "TENANT_USER_EMAIL_CONFLICT";
    private const string LastTenantAdminRequiredErrorCode = "LAST_TENANT_ADMIN_REQUIRED";
    private const string LastTenantOwnerRequiredErrorCode = "LAST_TENANT_OWNER_REQUIRED";
    private const string TenantRoleInvalidErrorCode = "TENANT_ROLE_INVALID";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string TenantForbiddenErrorCode = "TENANT_FORBIDDEN";

    [Fact]
    public async Task Should_ListOnlyCurrentTenantUsers_When_CallerIsTenantAdmin()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-list-users",
            "owner@cp8-list-users.local");

        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-list-users-other");
        var member = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "reader@cp8-list-users.local",
            TenantRole.BinderRead,
            isOwner: false);
        var otherTenantUser = await SeedTenantMemberAsync(
            host,
            otherTenant,
            "owner@cp8-list-users-other.local",
            TenantRole.TenantAdmin);

        using var request = CreateTenantUserListRequest(adminContext.Tenant, adminContext.Session);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<ListTenantUsersResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Collection(
            payload!.Users.OrderBy(user => user.Email, StringComparer.OrdinalIgnoreCase),
            user =>
            {
                Assert.Equal(adminContext.Admin.Id, user.UserId);
                Assert.Equal(adminContext.Admin.Email, user.Email);
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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-non-admin",
            "owner@cp8-non-admin.local");
        var member = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "reader@cp8-non-admin.local",
            TenantRole.BinderRead,
            isOwner: false);

        var memberSession = await AuthIntegrationTestClient.LoginAsync(host, member.Email, member.Password);
        using var request = CreateTenantUserListRequest(adminContext.Tenant, memberSession);

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RootHostRequestsTenantUserRoute()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-root-host",
            "owner@cp8-root-host.local");

        using var request = new HttpRequestMessage(HttpMethod.Get, TenantUsersPath);
        request.Headers.Host = "paperbinder.localhost";
        request.Headers.Add("Cookie", adminContext.Session.ToCookieHeader());

        var response = await host.Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_CreateTenantUser_AndAllowLogin_When_RequestIsValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-create-user",
            "owner@cp8-create-user.local");
        var createBody = new TenantUserCreateRequestBody(
            "writer@cp8-create-user.local",
            nameof(TenantRole.BinderWrite));

        using var createRequest = CreateTenantUserRequest(
            adminContext.Tenant,
            adminContext.Session,
            createBody,
            adminContext.Session.CsrfCookieValue);

        var createResponse = await host.Client.SendAsync(createRequest);
        var createdUser = await createResponse.Content.ReadFromJsonAsync<TenantUserPayload>();

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(createdUser);
        Assert.Equal(createBody.Email, createdUser!.Email);
        Assert.Equal(createBody.Role, createdUser.Role);
        Assert.False(createdUser.IsOwner);
        Assert.NotNull(createdUser.Credentials);
        Assert.Equal(createdUser.Email, createdUser.Credentials!.Email);
        Assert.False(string.IsNullOrWhiteSpace(createdUser.Credentials.Password));

        var newUserSession = await AuthIntegrationTestClient.LoginAsync(
            host,
            createdUser.Email,
            createdUser.Credentials.Password);
        Assert.Equal($"http://{adminContext.Tenant.Slug}.paperbinder.localhost:8080/app", newUserSession.LoginPayload!.RedirectUrl);

        using var probeRequest = CreatePolicyProbeRequest(
            adminContext.Tenant,
            newUserSession,
            BinderWritePolicyProbePath);

        var probeResponse = await host.Client.SendAsync(probeRequest);

        Assert.Equal(HttpStatusCode.OK, probeResponse.StatusCode);
    }

    [Fact]
    public async Task Should_ReturnConflict_When_TenantUserEmailAlreadyExists()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-email-conflict",
            "owner@cp8-email-conflict.local");
        var existingUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "existing@cp8-email-conflict.local",
            TenantRole.BinderRead,
            isOwner: false);
        var createBody = new TenantUserCreateRequestBody(
            existingUser.Email,
            nameof(TenantRole.BinderRead));

        using var request = CreateTenantUserRequest(
            adminContext.Tenant,
            adminContext.Session,
            createBody,
            adminContext.Session.CsrfCookieValue);

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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-invalid-email",
            "owner@cp8-invalid-email.local");

        using var request = CreateTenantUserRequest(
            adminContext.Tenant,
            adminContext.Session,
            new TenantUserCreateRequestBody(
                "not-an-email",
                nameof(TenantRole.BinderRead)),
            adminContext.Session.CsrfCookieValue);

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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-invalid-role",
            "owner@cp8-invalid-role.local");

        using var request = CreateTenantUserRequest(
            adminContext.Tenant,
            adminContext.Session,
            new TenantUserCreateRequestBody(
                "invalid-role@cp8.local",
                "Nope"),
            adminContext.Session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(TenantRoleInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectTenantUserCreate_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-create-csrf-missing",
            "owner@cp8-create-csrf-missing.local");

        using var request = CreateTenantUserRequest(
            adminContext.Tenant,
            adminContext.Session,
            new TenantUserCreateRequestBody(
                "missing-csrf@cp8.local",
                nameof(TenantRole.BinderRead)));

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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-role-csrf-invalid",
            "owner@cp8-role-csrf-invalid.local");
        var targetUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "target@cp8-role-csrf-invalid.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var request = CreateTenantUserRoleChangeRequest(
            adminContext.Tenant,
            adminContext.Session,
            targetUser.Id,
            new TenantUserRoleChangeRequestBody(nameof(TenantRole.BinderWrite)),
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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-role-change",
            "owner@cp8-role-change.local");
        var targetUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "target@cp8-role-change.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var request = CreateTenantUserRoleChangeRequest(
            adminContext.Tenant,
            adminContext.Session,
            targetUser.Id,
            new TenantUserRoleChangeRequestBody(nameof(TenantRole.BinderWrite)),
            adminContext.Session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantUserPayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(targetUser.Id, payload!.UserId);
        Assert.Equal(nameof(TenantRole.BinderWrite), payload.Role);
    }

    [Fact]
    public async Task Should_ChangeTenantUserRole_When_RequestRoleHasSurroundingWhitespace()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-role-change-trimmed",
            "owner@cp8-role-change-trimmed.local");
        var targetUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "target@cp8-role-change-trimmed.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var request = CreateTenantUserRoleChangeRequest(
            adminContext.Tenant,
            adminContext.Session,
            targetUser.Id,
            new TenantUserRoleChangeRequestBody(" TenantAdmin "),
            adminContext.Session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<TenantUserPayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload);
        Assert.Equal(targetUser.Id, payload!.UserId);
        Assert.Equal(nameof(TenantRole.TenantAdmin), payload.Role);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RoleChangeTargetsUserOutsideCurrentTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-role-not-found",
            "owner@cp8-role-not-found.local");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-role-not-found-other");
        var otherTenantUser = await SeedTenantMemberAsync(
            host,
            otherTenant,
            "target@cp8-role-not-found-other.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var request = CreateTenantUserRoleChangeRequest(
            adminContext.Tenant,
            adminContext.Session,
            otherTenantUser.Id,
            new TenantUserRoleChangeRequestBody(nameof(TenantRole.BinderWrite)),
            adminContext.Session.CsrfCookieValue);

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

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-last-admin",
            "owner@cp8-last-admin.local");

        using var request = CreateTenantUserRoleChangeRequest(
            adminContext.Tenant,
            adminContext.Session,
            adminContext.Admin.Id,
            new TenantUserRoleChangeRequestBody(nameof(TenantRole.BinderRead)),
            adminContext.Session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(LastTenantAdminRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_DeleteTenantUser_AndPreventFutureLogin_When_RequestIsValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-delete-user",
            "owner@cp8-delete-user.local");
        var targetUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "delete-me@cp8-delete-user.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var deleteRequest = CreateTenantUserDeleteRequest(
            adminContext.Tenant,
            adminContext.Session,
            targetUser.Id,
            adminContext.Session.CsrfCookieValue);

        var deleteResponse = await host.Client.SendAsync(deleteRequest);

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var listRequest = CreateTenantUserListRequest(adminContext.Tenant, adminContext.Session);
        var listResponse = await host.Client.SendAsync(listRequest);
        var listPayload = await listResponse.Content.ReadFromJsonAsync<ListTenantUsersResponsePayload>();

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.NotNull(listPayload);
        Assert.DoesNotContain(listPayload!.Users, user => user.UserId == targetUser.Id);

        using var loginRequest = AuthIntegrationTestClient.CreateLoginRequest(targetUser.Email, targetUser.Password);
        var loginResponse = await host.Client.SendAsync(loginRequest);
        var problem = await loginResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Unauthorized, loginResponse.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("INVALID_CREDENTIALS", TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectTenantUserDelete_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-delete-csrf-missing",
            "owner@cp8-delete-csrf-missing.local");
        var targetUser = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "delete-me@cp8-delete-csrf-missing.local",
            TenantRole.BinderRead,
            isOwner: false);

        using var request = CreateTenantUserDeleteRequest(
            adminContext.Tenant,
            adminContext.Session,
            targetUser.Id);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnConflict_When_RequestWouldDeleteLastTenantAdmin()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-delete-last-admin");
        var owner = await SeedTenantMemberAsync(
            host,
            tenant,
            "owner@cp8-delete-last-admin.local",
            TenantRole.BinderRead,
            isOwner: true);
        var actingAdmin = await SeedTenantMemberAsync(
            host,
            tenant,
            "admin@cp8-delete-last-admin.local",
            TenantRole.TenantAdmin,
            isOwner: false);
        var session = await AuthIntegrationTestClient.LoginAsync(host, actingAdmin.Email, actingAdmin.Password);

        using var request = CreateTenantUserDeleteRequest(
            tenant,
            session,
            actingAdmin.Id,
            session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal(LastTenantAdminRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnConflict_When_RequestWouldDeleteTenantOwner()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-delete-last-owner");
        var owner = await SeedTenantMemberAsync(
            host,
            tenant,
            "owner@cp8-delete-last-owner.local",
            TenantRole.BinderRead,
            isOwner: true);
        await SeedTenantMemberAsync(
            host,
            tenant,
            "co-owner@cp8-delete-last-owner.local",
            TenantRole.BinderRead,
            isOwner: true);
        var actingAdmin = await SeedTenantMemberAsync(
            host,
            tenant,
            "admin@cp8-delete-last-owner.local",
            TenantRole.TenantAdmin,
            isOwner: false);
        var session = await AuthIntegrationTestClient.LoginAsync(host, actingAdmin.Email, actingAdmin.Password);

        using var request = CreateTenantUserDeleteRequest(
            tenant,
            session,
            owner.Id,
            session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Equal("The workspace owner cannot be deleted.", problem!.Title);
        Assert.Equal("The workspace owner cannot be deleted.", problem.Detail);
        Assert.Equal(LastTenantOwnerRequiredErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ApplyRoleHierarchy_On_TestPolicyProbes()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var adminContext = await CreateTenantAdminContextAsync(
            host,
            "cp8-policy-hierarchy",
            "admin@cp8-policy-hierarchy.local");
        var writer = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "writer@cp8-policy-hierarchy.local",
            TenantRole.BinderWrite,
            isOwner: false);
        var reader = await SeedTenantMemberAsync(
            host,
            adminContext.Tenant,
            "reader@cp8-policy-hierarchy.local",
            TenantRole.BinderRead,
            isOwner: false);

        var writerSession = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        var readerSession = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);

        await AssertPolicyMatrixAsync(
            host,
            adminContext.Tenant,
            [
                new PolicyExpectation(
                    "tenant admin",
                    adminContext.Session,
                    [
                        new PolicyProbeExpectation(AuthenticatedPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderReadPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderWritePolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(TenantAdminPolicyProbePath, HttpStatusCode.OK)
                    ]),
                new PolicyExpectation(
                    "binder writer",
                    writerSession,
                    [
                        new PolicyProbeExpectation(AuthenticatedPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderReadPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderWritePolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(TenantAdminPolicyProbePath, HttpStatusCode.Forbidden)
                    ]),
                new PolicyExpectation(
                    "binder reader",
                    readerSession,
                    [
                        new PolicyProbeExpectation(AuthenticatedPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderReadPolicyProbePath, HttpStatusCode.OK),
                        new PolicyProbeExpectation(BinderWritePolicyProbePath, HttpStatusCode.Forbidden),
                        new PolicyProbeExpectation(TenantAdminPolicyProbePath, HttpStatusCode.Forbidden)
                    ])
            ]);
    }

    [Fact]
    public async Task Should_RejectTestPolicyProbe_When_AuthenticatedUserTargetsDifferentTenantHost()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await StartHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-policy-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp8-policy-tenant-b");
        var user = await SeedTenantMemberAsync(
            host,
            tenant,
            "reader@cp8-policy-tenant-a.local",
            TenantRole.BinderRead,
            isOwner: false);
        var session = await AuthIntegrationTestClient.LoginAsync(host, user.Email, user.Password);

        using var request = CreatePolicyProbeRequest(otherTenant, session, BinderReadPolicyProbePath);

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

    private static async Task<TenantAdminContext> CreateTenantAdminContextAsync(
        PaperBinderApplicationHost host,
        string tenantSlug,
        string adminEmail)
    {
        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, tenantSlug);
        var admin = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, adminEmail, DefaultPassword);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, admin, tenant, TenantRole.TenantAdmin);

        var session = await AuthIntegrationTestClient.LoginAsync(host, admin.Email, admin.Password);
        return new TenantAdminContext(tenant, admin, session);
    }

    private static async Task<SeededUser> SeedTenantMemberAsync(
        PaperBinderApplicationHost host,
        SeededTenant tenant,
        string email,
        TenantRole role,
        bool isOwner = true)
    {
        var user = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, email, DefaultPassword);
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, user, tenant, role, isOwner);
        return user;
    }

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

    private static async Task AssertPolicyMatrixAsync(
        PaperBinderApplicationHost host,
        SeededTenant tenant,
        IReadOnlyList<PolicyExpectation> expectations)
    {
        foreach (var expectation in expectations)
        {
            foreach (var probe in expectation.Probes)
            {
                await AssertPolicyStatusAsync(host, tenant, expectation.Actor, expectation.Session, probe);
            }
        }
    }

    private static async Task AssertPolicyStatusAsync(
        PaperBinderApplicationHost host,
        SeededTenant tenant,
        string actor,
        AuthenticatedSession session,
        PolicyProbeExpectation probe)
    {
        using var request = CreatePolicyProbeRequest(tenant, session, probe.Path);
        using var response = await host.Client.SendAsync(request);

        Assert.True(
            response.StatusCode == probe.ExpectedStatus,
            $"{actor} expected {probe.ExpectedStatus} from {probe.Path} but received {response.StatusCode}.");
    }

    private static HttpRequestMessage CreateTenantUserListRequest(
        SeededTenant tenant,
        AuthenticatedSession session) =>
        CreateTenantApiRequest(HttpMethod.Get, tenant, session, TenantUsersPath);

    private static HttpRequestMessage CreateTenantUserRequest(
        SeededTenant tenant,
        AuthenticatedSession session,
        TenantUserCreateRequestBody body,
        string? csrfToken = null) =>
        CreateTenantApiRequest(HttpMethod.Post, tenant, session, TenantUsersPath, body, csrfToken);

    private static HttpRequestMessage CreateTenantUserRoleChangeRequest(
        SeededTenant tenant,
        AuthenticatedSession session,
        Guid userId,
        TenantUserRoleChangeRequestBody body,
        string? csrfToken = null) =>
        CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"{TenantUsersPath}/{userId:D}/role",
            body,
            csrfToken);

    private static HttpRequestMessage CreateTenantUserDeleteRequest(
        SeededTenant tenant,
        AuthenticatedSession session,
        Guid userId,
        string? csrfToken = null) =>
        CreateTenantApiRequest(
            HttpMethod.Delete,
            tenant,
            session,
            $"{TenantUsersPath}/{userId:D}",
            csrfToken: csrfToken);

    private static HttpRequestMessage CreatePolicyProbeRequest(
        SeededTenant tenant,
        AuthenticatedSession session,
        string path) =>
        CreateTenantApiRequest(HttpMethod.Get, tenant, session, path);

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

    private sealed record TenantAdminContext(
        SeededTenant Tenant,
        SeededUser Admin,
        AuthenticatedSession Session);

    private sealed record TenantUserCreateRequestBody(
        string Email,
        string Role);

    private sealed record TenantUserRoleChangeRequestBody(string Role);

    private sealed record PolicyExpectation(
        string Actor,
        AuthenticatedSession Session,
        IReadOnlyList<PolicyProbeExpectation> Probes);

    private sealed record PolicyProbeExpectation(
        string Path,
        HttpStatusCode ExpectedStatus);

    private sealed record PolicyProbeResponse(bool Allowed);

    private sealed record ListTenantUsersResponsePayload(
        [property: JsonPropertyName("users")] IReadOnlyList<TenantUserPayload> Users);

    private sealed record TenantUserPayload(
        [property: JsonPropertyName("userId")] Guid UserId,
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("isOwner")] bool IsOwner,
        [property: JsonPropertyName("credentials")] TenantUserCredentialsPayload? Credentials = null);

    private sealed record TenantUserCredentialsPayload(
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("password")] string Password);
}
