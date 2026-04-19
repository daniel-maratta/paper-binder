using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace PaperBinder.Infrastructure.Diagnostics;

public static class PaperBinderTelemetry
{
    public const string ActivitySourceName = "PaperBinder";
    public const string MeterName = "PaperBinder";

    public static class ActivityNames
    {
        public const string DatabaseConnectionOpen = "paperbinder.db.connection.open";
        public const string DatabaseTransaction = "paperbinder.db.transaction";
        public const string WorkerCleanupCycle = "paperbinder.worker.cleanup-cycle";
    }

    public static class ActivityTags
    {
        public const string CorrelationId = "paperbinder.correlation_id";
        public const string TenantId = "paperbinder.tenant_id";
        public const string UserId = "paperbinder.user_id";
        public const string ActorUserId = "paperbinder.actor_user_id";
        public const string EffectiveUserId = "paperbinder.effective_user_id";
        public const string IsImpersonated = "paperbinder.is_impersonated";
        public const string Surface = "paperbinder.surface";
        public const string CleanupSelectedTenantCount = "paperbinder.cleanup.selected_tenant_count";
        public const string CleanupPurgedTenantCount = "paperbinder.cleanup.purged_tenant_count";
        public const string CleanupSkippedTenantCount = "paperbinder.cleanup.skipped_tenant_count";
        public const string CleanupFailedTenantCount = "paperbinder.cleanup.failed_tenant_count";
    }

    public static class SecurityDenialSurfaces
    {
        public const string Authorization = "authorization";
        public const string Challenge = "challenge";
        public const string Csrf = "csrf";
        public const string EndpointHostRequirement = "endpoint_host_requirement";
        public const string TenantResolution = "tenant_resolution";
    }

    public static class SecurityDenialReasons
    {
        public const string AccessDenied = "access_denied";
        public const string AuthenticationRequired = "authentication_required";
        public const string ChallengeFailed = "challenge_failed";
        public const string ChallengeRequired = "challenge_required";
        public const string CsrfTokenInvalid = "csrf_token_invalid";
        public const string EndpointHostMismatch = "endpoint_host_mismatch";
        public const string TenantExpired = "tenant_expired";
        public const string TenantForbidden = "tenant_forbidden";
        public const string TenantHostInvalid = "tenant_host_invalid";
        public const string TenantNotFound = "tenant_not_found";
    }

    public static class RateLimitPolicies
    {
        public const string AuthenticatedTenantMutation = "authenticated_tenant_mutation";
        public const string RootHostPreAuth = "root_host_preauth";
        public const string TenantLeaseExtend = "tenant_lease_extend";
    }

    public static class RateLimitSurfaces
    {
        public const string RootHost = "root_host";
        public const string TenantHost = "tenant_host";
    }

    public static class CleanupResults
    {
        public const string Completed = "completed";
        public const string Failed = "failed";
        public const string Purged = "purged";
        public const string Skipped = "skipped";
    }

    public static class MetricNames
    {
        public const string SecurityDenialsTotal = "paperbinder_security_denials_total";
        public const string RateLimitRejectionsTotal = "paperbinder_rate_limit_rejections_total";
        public const string CleanupCyclesTotal = "paperbinder_cleanup_cycles_total";
        public const string CleanupTenantsTotal = "paperbinder_cleanup_tenants_total";
    }

    public static class MetricTagKeys
    {
        public const string Policy = "policy";
        public const string Reason = "reason";
        public const string Result = "result";
        public const string Surface = "surface";
    }

    private static readonly ActivitySource ActivitySource = new(ActivitySourceName);
    private static readonly Meter Meter = new(MeterName);
    private static readonly Counter<long> SecurityDenialsCounter = Meter.CreateCounter<long>(MetricNames.SecurityDenialsTotal);
    private static readonly Counter<long> RateLimitRejectionsCounter = Meter.CreateCounter<long>(MetricNames.RateLimitRejectionsTotal);
    private static readonly Counter<long> CleanupCyclesCounter = Meter.CreateCounter<long>(MetricNames.CleanupCyclesTotal);
    private static readonly Counter<long> CleanupTenantsCounter = Meter.CreateCounter<long>(MetricNames.CleanupTenantsTotal);

    public static Activity? StartActivity(string name, ActivityKind kind = ActivityKind.Internal) =>
        ActivitySource.StartActivity(name, kind);

    public static void RecordSecurityDenial(string reason, string surface) =>
        SecurityDenialsCounter.Add(
            1,
            new KeyValuePair<string, object?>(MetricTagKeys.Reason, reason),
            new KeyValuePair<string, object?>(MetricTagKeys.Surface, surface));

    public static void RecordRateLimitRejection(string policy, string surface) =>
        RateLimitRejectionsCounter.Add(
            1,
            new KeyValuePair<string, object?>(MetricTagKeys.Policy, policy),
            new KeyValuePair<string, object?>(MetricTagKeys.Surface, surface));

    public static void RecordCleanupCycle(string result) =>
        CleanupCyclesCounter.Add(
            1,
            new KeyValuePair<string, object?>(MetricTagKeys.Result, result));

    public static void RecordCleanupTenants(string result, int count)
    {
        if (count <= 0)
        {
            return;
        }

        CleanupTenantsCounter.Add(
            count,
            new KeyValuePair<string, object?>(MetricTagKeys.Result, result));
    }
}
