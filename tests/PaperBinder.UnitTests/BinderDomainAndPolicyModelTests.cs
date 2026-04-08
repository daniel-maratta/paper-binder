using Microsoft.AspNetCore.Http;
using PaperBinder.Api;
using PaperBinder.Application.Binders;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.UnitTests;

public sealed class BinderDomainAndPolicyModelTests
{
    public static IEnumerable<object[]> BinderPolicyEvaluatorCases()
    {
        yield return [BinderPolicyMode.Inherit, Array.Empty<TenantRole>(), TenantRole.BinderRead, true];
        yield return [BinderPolicyMode.RestrictedRoles, new[] { TenantRole.BinderRead }, TenantRole.BinderRead, true];
        yield return [BinderPolicyMode.RestrictedRoles, new[] { TenantRole.BinderRead }, TenantRole.BinderWrite, false];
        yield return [BinderPolicyMode.RestrictedRoles, new[] { TenantRole.TenantAdmin, TenantRole.BinderWrite }, TenantRole.TenantAdmin, true];
    }

    [Theory]
    [MemberData(nameof(BinderPolicyEvaluatorCases))]
    public void BinderPolicyEvaluator_Should_ApplyExactRoleAllowLists(
        BinderPolicyMode mode,
        TenantRole[] allowedRoles,
        TenantRole callerRole,
        bool expectedAllowed)
    {
        var evaluator = new BinderPolicyEvaluator();
        var policy = new BinderPolicy(mode, allowedRoles);

        var allowed = evaluator.CanAccess(callerRole, policy);

        Assert.Equal(expectedAllowed, allowed);
    }

    [Fact]
    public void BinderNameRules_Should_TrimWhitespace_ForValidName()
    {
        var result = BinderNameRules.TryNormalize("  Executive Policies  ", out var normalizedName);

        Assert.True(result);
        Assert.Equal("Executive Policies", normalizedName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BinderNameRules_Should_RejectBlankNames(string? input)
    {
        var result = BinderNameRules.TryNormalize(input, out _);

        Assert.False(result);
    }

    [Fact]
    public void BinderNameRules_Should_RejectOverlengthNames()
    {
        var input = new string('a', BinderNameRules.MaxLength + 1);

        var result = BinderNameRules.TryNormalize(input, out _);

        Assert.False(result);
    }

    [Fact]
    public void BinderPolicyRules_Should_RejectUnsupportedMode()
    {
        var result = BinderPolicyRules.ValidateAndNormalize("custom", []);

        Assert.False(result.Succeeded);
        Assert.Equal("The supplied binder policy mode is not supported.", result.Detail);
    }

    [Fact]
    public void BinderPolicyRules_Should_RejectAllowedRoles_When_ModeIsInherit()
    {
        var result = BinderPolicyRules.ValidateAndNormalize(
            BinderPolicyModeNames.Inherit,
            [nameof(TenantRole.BinderRead)]);

        Assert.False(result.Succeeded);
        Assert.Contains("must be empty", result.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public void BinderPolicyRules_Should_RejectRestrictedRolesMode_When_NoRolesRemain()
    {
        var result = BinderPolicyRules.ValidateAndNormalize(
            BinderPolicyModeNames.RestrictedRoles,
            []);

        Assert.False(result.Succeeded);
        Assert.Contains("must include at least one valid tenant role", result.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public void BinderPolicyRules_Should_RejectInvalidRoleValues()
    {
        var result = BinderPolicyRules.ValidateAndNormalize(
            BinderPolicyModeNames.RestrictedRoles,
            ["Nope"]);

        Assert.False(result.Succeeded);
        Assert.Contains("valid v1 tenant role values", result.Detail, StringComparison.Ordinal);
    }

    [Fact]
    public void BinderPolicyRules_Should_NormalizeDistinctRoles_InCanonicalOrder()
    {
        var result = BinderPolicyRules.ValidateAndNormalize(
            BinderPolicyModeNames.RestrictedRoles,
            [nameof(TenantRole.BinderRead), nameof(TenantRole.TenantAdmin), nameof(TenantRole.BinderRead)]);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.Policy);
        Assert.Equal(BinderPolicyMode.RestrictedRoles, result.Policy!.Mode);
        Assert.Equal(
            [TenantRole.TenantAdmin, TenantRole.BinderRead],
            result.Policy.AllowedRoles);
    }

    [Fact]
    public void BinderProblemMapping_Should_MapPolicyInvalidFailure_ToStableProblemContract()
    {
        var problem = PaperBinderBinderProblemMapping.Map(
            new BinderFailure(
                BinderFailureKind.PolicyInvalid,
                "The `allowedRoles` collection must include at least one valid tenant role when `mode` is `restricted_roles`."));

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, problem.StatusCode);
        Assert.Equal("Binder policy invalid.", problem.Title);
        Assert.Equal(PaperBinderErrorCodes.BinderPolicyInvalid, problem.ErrorCode);
    }
}
