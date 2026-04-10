using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class DocumentDomainAndImmutableDocumentRulesIntegrationTests(PostgresContainerFixture postgres)
{
    private const string ApiVersionHeader = "X-Api-Version";
    private const string CorrelationIdHeader = "X-Correlation-Id";
    private const string CurrentApiVersion = "1";
    private const string CsrfHeaderName = "X-CSRF-TOKEN";
    private const string MarkdownContentType = "markdown";
    private const string CsrfTokenInvalidErrorCode = "CSRF_TOKEN_INVALID";
    private const string BinderNotFoundErrorCode = "BINDER_NOT_FOUND";
    private const string BinderPolicyDeniedErrorCode = "BINDER_POLICY_DENIED";
    private const string DocumentNotFoundErrorCode = "DOCUMENT_NOT_FOUND";
    private const string DocumentTitleInvalidErrorCode = "DOCUMENT_TITLE_INVALID";
    private const string DocumentContentRequiredErrorCode = "DOCUMENT_CONTENT_REQUIRED";
    private const string DocumentContentTooLargeErrorCode = "DOCUMENT_CONTENT_TOO_LARGE";
    private const string DocumentContentTypeInvalidErrorCode = "DOCUMENT_CONTENT_TYPE_INVALID";
    private const string DocumentBinderRequiredErrorCode = "DOCUMENT_BINDER_REQUIRED";
    private const string DocumentSupersedesInvalidErrorCode = "DOCUMENT_SUPERSEDES_INVALID";
    private const string DocumentAlreadyArchivedErrorCode = "DOCUMENT_ALREADY_ARCHIVED";
    private const string DocumentNotArchivedErrorCode = "DOCUMENT_NOT_ARCHIVED";

    [Fact]
    public async Task Should_CreateDocument_AndReturnDetail_When_RequestIsValid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-create");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-create.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Operations Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = binder.Id,
                title = "  Security Handbook  ",
                contentType = MarkdownContentType,
                content = "# Current policy"
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);
        Assert.Equal(binder.Id, payload!.BinderId);
        Assert.Equal("Security Handbook", payload.Title);
        Assert.Equal(MarkdownContentType, payload.ContentType);
        Assert.Equal("# Current policy", payload.Content);
        Assert.Null(payload.SupersedesDocumentId);
        Assert.Null(payload.ArchivedAt);
    }

    [Fact]
    public async Task Should_RejectDocumentCreate_When_RequestPayloadIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-create-invalid");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-create-invalid.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Validation Binder");
        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);

        var invalidCases = new[]
        {
            new
            {
                Body = (object)new
                {
                    title = "Missing binder",
                    contentType = MarkdownContentType,
                    content = "# Policy"
                },
                ExpectedStatus = HttpStatusCode.BadRequest,
                ExpectedErrorCode = DocumentBinderRequiredErrorCode
            },
            new
            {
                Body = (object)new
                {
                    binderId = binder.Id,
                    title = "   ",
                    contentType = MarkdownContentType,
                    content = "# Policy"
                },
                ExpectedStatus = HttpStatusCode.BadRequest,
                ExpectedErrorCode = DocumentTitleInvalidErrorCode
            },
            new
            {
                Body = (object)new
                {
                    binderId = binder.Id,
                    title = "Blank content",
                    contentType = MarkdownContentType,
                    content = "   "
                },
                ExpectedStatus = HttpStatusCode.BadRequest,
                ExpectedErrorCode = DocumentContentRequiredErrorCode
            },
            new
            {
                Body = (object)new
                {
                    binderId = binder.Id,
                    title = "Large content",
                    contentType = MarkdownContentType,
                    content = new string('a', 50_001)
                },
                ExpectedStatus = HttpStatusCode.BadRequest,
                ExpectedErrorCode = DocumentContentTooLargeErrorCode
            },
            new
            {
                Body = (object)new
                {
                    binderId = binder.Id,
                    title = "Wrong type",
                    contentType = "html",
                    content = "# Policy"
                },
                ExpectedStatus = HttpStatusCode.UnprocessableEntity,
                ExpectedErrorCode = DocumentContentTypeInvalidErrorCode
            }
        };

        foreach (var invalidCase in invalidCases)
        {
            using var request = CreateTenantApiRequest(
                HttpMethod.Post,
                tenant,
                session,
                "/api/documents",
                body: invalidCase.Body,
                csrfToken: session.CsrfCookieValue);

            var response = await host.Client.SendAsync(request);
            var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

            Assert.Equal(invalidCase.ExpectedStatus, response.StatusCode);
            AssertApiProtocolHeaders(response);
            Assert.NotNull(problem);
            Assert.Equal(invalidCase.ExpectedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
        }
    }

    [Fact]
    public async Task Should_ListDocuments_AndPopulateBinderDetailSummaries_When_VisibleDocumentsExist()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-list");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-list.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var visibleBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Visible Binder");
        var restrictedBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Restricted Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderWrite]);

        var activeDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            visibleBinder,
            "Operations Policy",
            "# Active document",
            createdAtUtc: DateTimeOffset.Parse("2026-04-09T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            visibleBinder,
            "Archived Policy",
            "# Archived document",
            createdAtUtc: DateTimeOffset.Parse("2026-04-09T13:00:00Z", System.Globalization.CultureInfo.InvariantCulture),
            archivedAtUtc: DateTimeOffset.Parse("2026-04-09T14:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            restrictedBinder,
            "Hidden Policy",
            "# Hidden document");

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);

        using var listRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/documents");
        var listResponse = await host.Client.SendAsync(listRequest);
        var listPayload = await listResponse.Content.ReadFromJsonAsync<ListDocumentsPayload>();

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        AssertApiProtocolHeaders(listResponse);
        Assert.NotNull(listPayload);
        var listedDocument = Assert.Single(listPayload!.Documents);
        Assert.Equal(activeDocument.Id, listedDocument.DocumentId);
        Assert.Null(listedDocument.ArchivedAt);

        using var includeArchivedRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, "/api/documents?includeArchived=true");
        var includeArchivedResponse = await host.Client.SendAsync(includeArchivedRequest);
        var includeArchivedPayload = await includeArchivedResponse.Content.ReadFromJsonAsync<ListDocumentsPayload>();

        Assert.Equal(HttpStatusCode.OK, includeArchivedResponse.StatusCode);
        AssertApiProtocolHeaders(includeArchivedResponse);
        Assert.NotNull(includeArchivedPayload);
        Assert.Equal(2, includeArchivedPayload!.Documents.Count);
        Assert.Contains(includeArchivedPayload.Documents, document => document.ArchivedAt is not null);

        using var binderDetailRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/binders/{visibleBinder.Id:D}");
        var binderDetailResponse = await host.Client.SendAsync(binderDetailRequest);
        var binderDetailPayload = await binderDetailResponse.Content.ReadFromJsonAsync<BinderDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, binderDetailResponse.StatusCode);
        AssertApiProtocolHeaders(binderDetailResponse);
        Assert.NotNull(binderDetailPayload);
        var binderDocument = Assert.Single(binderDetailPayload!.Documents);
        Assert.Equal(activeDocument.Id, binderDocument.DocumentId);
        Assert.Equal("Operations Policy", binderDocument.Title);
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_BinderFilteredDocumentListTargetsRestrictedBinder()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-list-denied");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-list-denied.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var restrictedBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Writers Only",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderWrite]);

        await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, restrictedBinder, "Hidden", "# hidden");

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/documents?binderId={restrictedBinder.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderPolicyDeniedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_DocumentWriteTargetsBinderDeniedByBinderPolicy()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-write-denied");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-write-denied.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var restrictedBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Readers Only",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderRead]);

        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var request = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = restrictedBinder.Id,
                title = "Denied write",
                contentType = MarkdownContentType,
                content = "# denied"
            },
            csrfToken: session.CsrfCookieValue);

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderPolicyDeniedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_BinderFilteredDocumentListTargetsWrongTenantBinder()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-list-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-list-tenant-b");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-list-tenant-b.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, otherTenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Tenant A Binder");
        await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Tenant A Document", "# tenant-a");

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, otherTenant, session, $"/api/documents?binderId={binder.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnArchivedDocumentDetail_ByDirectId_When_CallerIsAllowed()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-detail-archived");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-detail-archived.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Archived Detail Binder");
        var document = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            binder,
            "Archived Detail",
            "# archived detail",
            archivedAtUtc: DateTimeOffset.Parse("2026-04-09T14:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/documents/{document.Id:D}");

        var response = await host.Client.SendAsync(request);
        var payload = await response.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(payload);
        Assert.Equal(document.Id, payload!.DocumentId);
        Assert.Equal("# archived detail", payload.Content);
        Assert.NotNull(payload.ArchivedAt);
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_DocumentBinderPolicyDeniesSameTenantCaller()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-detail-denied");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-detail-denied.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(
            host,
            tenant,
            "Writer Restricted Binder",
            BinderPolicyMode.RestrictedRoles,
            [TenantRole.BinderWrite]);

        var document = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Denied", "# denied");
        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/documents/{document.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(BinderPolicyDeniedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_DocumentIdBelongsToAnotherTenant()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-detail-tenant-a");
        var otherTenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-detail-tenant-b");
        var otherTenantUser = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-detail-tenant-b.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, otherTenantUser, otherTenant, TenantRole.BinderRead, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Tenant A Documents");
        var document = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Tenant A Detail", "# tenant-a");

        var session = await AuthIntegrationTestClient.LoginAsync(host, otherTenantUser.Email, otherTenantUser.Password);
        using var request = CreateTenantApiRequest(HttpMethod.Get, otherTenant, session, $"/api/documents/{document.Id:D}");

        var response = await host.Client.SendAsync(request);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        AssertApiProtocolHeaders(response);
        Assert.NotNull(problem);
        Assert.Equal(DocumentNotFoundErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ValidateSameBinderSupersedesConstraint_When_CreateRequestSupersedesDocument()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-supersedes");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-supersedes.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Supersedes Binder");
        var otherBinder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Other Binder");
        var originalDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Original", "# v1");
        var otherBinderDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, otherBinder, "Other", "# other");

        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);
        using var validRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = binder.Id,
                title = "Original v2",
                contentType = MarkdownContentType,
                content = "# v2",
                supersedesDocumentId = originalDocument.Id
            },
            csrfToken: session.CsrfCookieValue);

        var validResponse = await host.Client.SendAsync(validRequest);
        var validPayload = await validResponse.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.Created, validResponse.StatusCode);
        AssertApiProtocolHeaders(validResponse);
        Assert.NotNull(validPayload);
        Assert.Equal(originalDocument.Id, validPayload!.SupersedesDocumentId);

        using var originalRequest = CreateTenantApiRequest(HttpMethod.Get, tenant, session, $"/api/documents/{originalDocument.Id:D}");
        var originalResponse = await host.Client.SendAsync(originalRequest);
        var originalPayload = await originalResponse.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, originalResponse.StatusCode);
        Assert.NotNull(originalPayload);
        Assert.Equal("Original", originalPayload!.Title);
        Assert.Equal("# v1", originalPayload.Content);
        Assert.Null(originalPayload.ArchivedAt);

        using var crossBinderRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = binder.Id,
                title = "Cross binder invalid",
                contentType = MarkdownContentType,
                content = "# invalid",
                supersedesDocumentId = otherBinderDocument.Id
            },
            csrfToken: session.CsrfCookieValue);

        var crossBinderResponse = await host.Client.SendAsync(crossBinderRequest);
        var crossBinderProblem = await crossBinderResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, crossBinderResponse.StatusCode);
        AssertApiProtocolHeaders(crossBinderResponse);
        Assert.NotNull(crossBinderProblem);
        Assert.Equal(DocumentSupersedesInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(crossBinderProblem!, "errorCode"));

        using var unknownRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = binder.Id,
                title = "Unknown supersedes invalid",
                contentType = MarkdownContentType,
                content = "# invalid",
                supersedesDocumentId = Guid.NewGuid()
            },
            csrfToken: session.CsrfCookieValue);

        var unknownResponse = await host.Client.SendAsync(unknownRequest);
        var unknownProblem = await unknownResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.UnprocessableEntity, unknownResponse.StatusCode);
        AssertApiProtocolHeaders(unknownResponse);
        Assert.NotNull(unknownProblem);
        Assert.Equal(DocumentSupersedesInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(unknownProblem!, "errorCode"));
    }

    [Fact]
    public async Task Should_ArchiveAndUnarchiveDocument_WithoutMutatingContent()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-archive");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-archive.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Archive Binder");
        var document = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Archive Me", "# immutable body");
        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);

        using var archiveRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{document.Id:D}/archive",
            csrfToken: session.CsrfCookieValue);

        var archiveResponse = await host.Client.SendAsync(archiveRequest);
        var archivedPayload = await archiveResponse.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, archiveResponse.StatusCode);
        AssertApiProtocolHeaders(archiveResponse);
        Assert.NotNull(archivedPayload);
        Assert.Equal("Archive Me", archivedPayload!.Title);
        Assert.Equal(MarkdownContentType, archivedPayload.ContentType);
        Assert.Equal("# immutable body", archivedPayload.Content);
        Assert.NotNull(archivedPayload.ArchivedAt);

        using var unarchiveRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{document.Id:D}/unarchive",
            csrfToken: session.CsrfCookieValue);

        var unarchiveResponse = await host.Client.SendAsync(unarchiveRequest);
        var unarchivedPayload = await unarchiveResponse.Content.ReadFromJsonAsync<DocumentDetailPayload>();

        Assert.Equal(HttpStatusCode.OK, unarchiveResponse.StatusCode);
        AssertApiProtocolHeaders(unarchiveResponse);
        Assert.NotNull(unarchivedPayload);
        Assert.Equal("Archive Me", unarchivedPayload!.Title);
        Assert.Equal(MarkdownContentType, unarchivedPayload.ContentType);
        Assert.Equal("# immutable body", unarchivedPayload.Content);
        Assert.Null(unarchivedPayload.ArchivedAt);
    }

    [Fact]
    public async Task Should_ReturnConflict_When_ArchiveTransitionIsInvalid()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-archive-invalid");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-archive-invalid.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "Archive Invalid Binder");
        var activeDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Active", "# active");
        var archivedDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            binder,
            "Archived",
            "# archived",
            archivedAtUtc: DateTimeOffset.Parse("2026-04-09T14:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);

        using var archiveAgainRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{archivedDocument.Id:D}/archive",
            csrfToken: session.CsrfCookieValue);

        var archiveAgainResponse = await host.Client.SendAsync(archiveAgainRequest);
        var archiveAgainProblem = await archiveAgainResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, archiveAgainResponse.StatusCode);
        AssertApiProtocolHeaders(archiveAgainResponse);
        Assert.NotNull(archiveAgainProblem);
        Assert.Equal(DocumentAlreadyArchivedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(archiveAgainProblem!, "errorCode"));

        using var unarchiveActiveRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{activeDocument.Id:D}/unarchive",
            csrfToken: session.CsrfCookieValue);

        var unarchiveActiveResponse = await host.Client.SendAsync(unarchiveActiveRequest);
        var unarchiveActiveProblem = await unarchiveActiveResponse.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

        Assert.Equal(HttpStatusCode.Conflict, unarchiveActiveResponse.StatusCode);
        AssertApiProtocolHeaders(unarchiveActiveResponse);
        Assert.NotNull(unarchiveActiveProblem);
        Assert.Equal(DocumentNotArchivedErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(unarchiveActiveProblem!, "errorCode"));
    }

    [Fact]
    public async Task Should_RejectUnsafeDocumentRoutes_When_CsrfTokenIsMissing()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-csrf");
        var writer = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "writer@cp10-csrf.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, writer, tenant, TenantRole.BinderWrite, isOwner: false);

        var binder = await TenantResolutionIntegrationTestHost.SeedBinderAsync(host, tenant, "CSRF Binder");
        var activeDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(host, tenant, binder, "Archive Target", "# active");
        var archivedDocument = await TenantResolutionIntegrationTestHost.SeedDocumentAsync(
            host,
            tenant,
            binder,
            "Unarchive Target",
            "# archived",
            archivedAtUtc: DateTimeOffset.Parse("2026-04-09T14:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        var session = await AuthIntegrationTestClient.LoginAsync(host, writer.Email, writer.Password);

        using var createRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            "/api/documents",
            body: new
            {
                binderId = binder.Id,
                title = "Missing csrf",
                contentType = MarkdownContentType,
                content = "# csrf"
            });

        using var archiveRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{activeDocument.Id:D}/archive");

        using var unarchiveRequest = CreateTenantApiRequest(
            HttpMethod.Post,
            tenant,
            session,
            $"/api/documents/{archivedDocument.Id:D}/unarchive");

        foreach (var request in new[] { createRequest, archiveRequest, unarchiveRequest })
        {
            var response = await host.Client.SendAsync(request);
            var problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>();

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            AssertApiProtocolHeaders(response);
            Assert.NotNull(problem);
            Assert.Equal(CsrfTokenInvalidErrorCode, TenantResolutionIntegrationTestHost.GetRequiredExtension(problem!, "errorCode"));
        }
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RootHostRequestsDocumentEndpoint()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await TenantResolutionIntegrationTestHost.StartDockerHostAsync(database.ConnectionString);

        var tenant = await TenantResolutionIntegrationTestHost.SeedTenantAsync(host, "cp10-root-host");
        var reader = await TenantResolutionIntegrationTestHost.SeedUserAsync(host, "reader@cp10-root-host.local", "checkpoint-10-password");
        await TenantResolutionIntegrationTestHost.SeedMembershipAsync(host, reader, tenant, TenantRole.BinderRead, isOwner: false);

        var session = await AuthIntegrationTestClient.LoginAsync(host, reader.Email, reader.Password);
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/documents");
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

    private sealed record ListDocumentsPayload(
        [property: JsonPropertyName("documents")] IReadOnlyList<DocumentSummaryPayload> Documents);

    private sealed record DocumentSummaryPayload(
        [property: JsonPropertyName("documentId")] Guid DocumentId,
        [property: JsonPropertyName("binderId")] Guid BinderId,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("contentType")] string ContentType,
        [property: JsonPropertyName("supersedesDocumentId")] Guid? SupersedesDocumentId,
        [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
        [property: JsonPropertyName("archivedAt")] DateTimeOffset? ArchivedAt);

    private sealed record DocumentDetailPayload(
        [property: JsonPropertyName("documentId")] Guid DocumentId,
        [property: JsonPropertyName("binderId")] Guid BinderId,
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("contentType")] string ContentType,
        [property: JsonPropertyName("content")] string Content,
        [property: JsonPropertyName("supersedesDocumentId")] Guid? SupersedesDocumentId,
        [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
        [property: JsonPropertyName("archivedAt")] DateTimeOffset? ArchivedAt);

    private sealed record BinderDetailPayload(
        [property: JsonPropertyName("binderId")] Guid BinderId,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt,
        [property: JsonPropertyName("documents")] IReadOnlyList<DocumentSummaryPayload> Documents);
}
