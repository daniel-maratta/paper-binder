using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using PaperBinder.Api;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.UnitTests;

public sealed class AuthorizationAndTenantUserAdministrationTests
{
    [Theory]
    [InlineData(TenantRole.TenantAdmin, TenantRole.TenantAdmin, true)]
    [InlineData(TenantRole.TenantAdmin, TenantRole.BinderWrite, true)]
    [InlineData(TenantRole.TenantAdmin, TenantRole.BinderRead, true)]
    [InlineData(TenantRole.BinderWrite, TenantRole.TenantAdmin, false)]
    [InlineData(TenantRole.BinderWrite, TenantRole.BinderWrite, true)]
    [InlineData(TenantRole.BinderWrite, TenantRole.BinderRead, true)]
    [InlineData(TenantRole.BinderRead, TenantRole.TenantAdmin, false)]
    [InlineData(TenantRole.BinderRead, TenantRole.BinderWrite, false)]
    [InlineData(TenantRole.BinderRead, TenantRole.BinderRead, true)]
    public async Task TenantMembershipAuthorizationHandler_Should_ApplyRoleHierarchy(
        TenantRole grantedRole,
        TenantRole requiredRole,
        bool expectedAuthorized)
    {
        var membershipContext = new PaperBinderTenantMembershipRequestContext();
        membershipContext.Establish(new TenantMembership(Guid.NewGuid(), Guid.NewGuid(), grantedRole, IsOwner: false));

        var handler = new TenantMembershipAuthorizationHandler(membershipContext);
        var requirement = new TenantMembershipAuthorizationRequirement(requiredRole);
        var authorizationContext = new AuthorizationHandlerContext(
            [requirement],
            CreateAuthenticatedPrincipal(),
            resource: null);

        await handler.HandleAsync(authorizationContext);

        Assert.Equal(expectedAuthorized, authorizationContext.HasSucceeded);
    }

    [Fact]
    public async Task TenantMembershipAuthorizationHandler_Should_RequireEstablishedMembershipContext()
    {
        var handler = new TenantMembershipAuthorizationHandler(new PaperBinderTenantMembershipRequestContext());
        var requirement = new TenantMembershipAuthorizationRequirement(MinimumRole: null);
        var authorizationContext = new AuthorizationHandlerContext(
            [requirement],
            CreateAuthenticatedPrincipal(),
            resource: null);

        await handler.HandleAsync(authorizationContext);

        Assert.False(authorizationContext.HasSucceeded);
    }

    [Fact]
    public void RequestTenantMembershipContext_Should_RejectSecondEstablishment()
    {
        var context = new PaperBinderTenantMembershipRequestContext();
        context.Establish(new TenantMembership(Guid.NewGuid(), Guid.NewGuid(), TenantRole.TenantAdmin, IsOwner: true));

        var ex = Assert.Throws<InvalidOperationException>(() =>
            context.Establish(new TenantMembership(Guid.NewGuid(), Guid.NewGuid(), TenantRole.BinderRead, IsOwner: false)));

        Assert.Equal("The request tenant membership context can only be established once per request.", ex.Message);
    }

    [Theory]
    [InlineData(nameof(TenantRole.TenantAdmin), TenantRole.TenantAdmin)]
    [InlineData(nameof(TenantRole.BinderWrite), TenantRole.BinderWrite)]
    [InlineData(nameof(TenantRole.BinderRead), TenantRole.BinderRead)]
    public void TenantRoleParser_Should_ParseCanonicalExactCaseRoleNames(string value, TenantRole expectedRole)
    {
        var result = TenantRoleParser.TryParse(value, out var parsedRole);

        Assert.True(result);
        Assert.Equal(expectedRole, parsedRole);
    }

    [Theory]
    [InlineData("not-a-role")]
    [InlineData("tenantadmin")]
    [InlineData("1")]
    public void TenantRoleParser_Should_RejectInvalidMixedCaseOrNumericRoleValues(string value)
    {
        var result = TenantRoleParser.TryParse(value, out _);

        Assert.False(result);
    }

    [Fact]
    public void TenantUserProblemMapping_Should_MapInvalidPasswordFailure_ToStableProblemContract()
    {
        var problem = PaperBinderTenantUserProblemMapping.Map(
            new TenantUserAdministrationFailure(
                TenantUserAdministrationFailureKind.InvalidPassword,
                "Passwords must be at least 8 characters."));

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.StatusCode);
        Assert.Equal("Tenant user password invalid.", problem.Title);
        Assert.Equal(PaperBinderErrorCodes.TenantUserPasswordInvalid, problem.ErrorCode);
    }

    [Theory]
    [InlineData(TenantRole.TenantAdmin, TenantRole.BinderRead, 1, true)]
    [InlineData(TenantRole.TenantAdmin, TenantRole.BinderWrite, 2, false)]
    [InlineData(TenantRole.TenantAdmin, TenantRole.TenantAdmin, 1, false)]
    [InlineData(TenantRole.BinderWrite, TenantRole.BinderRead, 1, false)]
    public void TenantUserAdministrationRules_Should_ApplyLastAdminGuard(
        TenantRole currentRole,
        TenantRole requestedRole,
        int tenantAdminCount,
        bool expectedBlocked)
    {
        var blocked = TenantUserAdministrationRules.WouldDemoteLastAdmin(
            currentRole,
            requestedRole,
            tenantAdminCount);

        Assert.Equal(expectedBlocked, blocked);
    }

    private static ClaimsPrincipal CreateAuthenticatedPrincipal()
    {
        var userId = Guid.NewGuid();
        return new ClaimsPrincipal(
            new ClaimsIdentity(
                [new Claim(ClaimTypes.NameIdentifier, userId.ToString("D"))],
                authenticationType: "test"));
    }
}
