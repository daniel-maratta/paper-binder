using Microsoft.AspNetCore.Http;
using PaperBinder.Api;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.UnitTests;

public sealed class TenantLeaseLifecycleTests
{
    private static readonly TenantLeasePolicy DefaultPolicy = new(
        ExtensionWindowMinutes: 10,
        ExtensionMinutes: 15,
        MaxExtensions: 3);

    [Fact]
    public void TenantLeaseRules_Should_ProjectLeaseState_WithNonNegativeSecondsRemaining()
    {
        var snapshot = new TenantLeaseSnapshot(
            Guid.NewGuid(),
            "demo",
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture),
            ExtensionCount: 1);

        var projected = TenantLeaseRules.ProjectState(
            snapshot,
            DefaultPolicy,
            DateTimeOffset.Parse("2026-04-10T12:05:15Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.Equal(snapshot.ExpiresAtUtc, projected.ExpiresAtUtc);
        Assert.Equal(0, projected.SecondsRemaining);
        Assert.Equal(1, projected.ExtensionCount);
        Assert.Equal(3, projected.MaxExtensions);
        Assert.False(projected.CanExtend);
    }

    [Theory]
    [InlineData("2026-04-10T12:10:00Z", 0, true)]
    [InlineData("2026-04-10T12:05:00Z", 0, true)]
    [InlineData("2026-04-10T12:01:00Z", 2, true)]
    [InlineData("2026-04-10T12:11:00Z", 0, false)]
    [InlineData("2026-04-10T12:05:00Z", 3, false)]
    [InlineData("2026-04-10T11:59:59Z", 0, false)]
    public void TenantLeaseRules_Should_AllowExtension_OnlyWithinWindow_AndBelowLimit(
        string expiresAtUtc,
        int extensionCount,
        bool expectedCanExtend)
    {
        var canExtend = TenantLeaseRules.CanExtend(
            DateTimeOffset.Parse(expiresAtUtc, System.Globalization.CultureInfo.InvariantCulture),
            extensionCount,
            DefaultPolicy,
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.Equal(expectedCanExtend, canExtend);
    }

    [Fact]
    public void TenantLeaseRules_Should_ProjectExactWholeSecondDifference()
    {
        var snapshot = new TenantLeaseSnapshot(
            Guid.NewGuid(),
            "demo",
            DateTimeOffset.Parse("2026-04-10T12:08:00Z", System.Globalization.CultureInfo.InvariantCulture),
            ExtensionCount: 0);

        var projected = TenantLeaseRules.ProjectState(
            snapshot,
            DefaultPolicy,
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.Equal(480, projected.SecondsRemaining);
        Assert.True(projected.CanExtend);
    }

    [Fact]
    public void TenantLeaseCleanupRules_Should_AllowPurge_When_TenantIsExpiredAndInactive()
    {
        var canPurge = TenantLeaseCleanupRules.CanPurgeExpiredTenant(
            DateTimeOffset.Parse("2026-04-10T11:59:00Z", System.Globalization.CultureInfo.InvariantCulture),
            DateTimeOffset.Parse("2026-04-10T11:55:00Z", System.Globalization.CultureInfo.InvariantCulture),
            TimeSpan.FromMinutes(3),
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.True(canPurge);
    }

    [Fact]
    public void TenantLeaseCleanupRules_Should_SkipPurge_When_TenantHasRecentAuthenticatedActivity()
    {
        var canPurge = TenantLeaseCleanupRules.CanPurgeExpiredTenant(
            DateTimeOffset.Parse("2026-04-10T11:59:00Z", System.Globalization.CultureInfo.InvariantCulture),
            DateTimeOffset.Parse("2026-04-10T11:58:30Z", System.Globalization.CultureInfo.InvariantCulture),
            TimeSpan.FromMinutes(3),
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.False(canPurge);
    }

    [Fact]
    public void TenantLeaseCleanupRules_Should_SkipPurge_When_TenantIsNotExpired()
    {
        var canPurge = TenantLeaseCleanupRules.CanPurgeExpiredTenant(
            DateTimeOffset.Parse("2026-04-10T12:01:00Z", System.Globalization.CultureInfo.InvariantCulture),
            null,
            TimeSpan.FromMinutes(3),
            DateTimeOffset.Parse("2026-04-10T12:00:00Z", System.Globalization.CultureInfo.InvariantCulture));

        Assert.False(canPurge);
    }

    [Fact]
    public void TenantLeaseProblemMapping_Should_MapStableLeaseSpecificConflictCodes()
    {
        var windowProblem = PaperBinderTenantLeaseProblemMapping.Map(
            new TenantLeaseFailure(
                TenantLeaseFailureKind.ExtensionWindowNotOpen,
                "The remaining lease is above the extension window."));

        var limitProblem = PaperBinderTenantLeaseProblemMapping.Map(
            new TenantLeaseFailure(
                TenantLeaseFailureKind.ExtensionLimitReached,
                "The tenant has already used the maximum number of extensions."));

        Assert.Equal(StatusCodes.Status409Conflict, windowProblem.StatusCode);
        Assert.Equal(PaperBinderErrorCodes.TenantLeaseExtensionWindowNotOpen, windowProblem.ErrorCode);
        Assert.Equal(StatusCodes.Status409Conflict, limitProblem.StatusCode);
        Assert.Equal(PaperBinderErrorCodes.TenantLeaseExtensionLimitReached, limitProblem.ErrorCode);
    }
}
