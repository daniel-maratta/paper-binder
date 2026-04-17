using System.Security.Cryptography;
using System.Security.Claims;
using Dapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using PaperBinder.Application.Persistence;
using PaperBinder.Application.Tenancy;
using PaperBinder.Application.Time;
using PaperBinder.Infrastructure.Identity;

namespace PaperBinder.Api;

internal interface IPaperBinderImpersonationService
{
    Task<TenantImpersonationStatusResponse> GetStatusAsync(
        TenantContext tenant,
        IRequestExecutionUserContext executionUserContext,
        TenantMembership effectiveMembership,
        CancellationToken cancellationToken);

    Task<TenantImpersonationOperationResult> StartAsync(
        HttpContext context,
        TenantContext tenant,
        TenantMembership effectiveMembership,
        IRequestExecutionUserContext executionUserContext,
        Guid targetUserId,
        CancellationToken cancellationToken);

    Task<TenantImpersonationOperationResult> StopAsync(
        HttpContext context,
        TenantContext tenant,
        TenantMembership effectiveMembership,
        IRequestExecutionUserContext executionUserContext,
        CancellationToken cancellationToken);

    Task<bool> TryRecordExpiredImpersonationAsync(
        HttpContext context,
        ResolvedTenantHost tenantHost,
        CancellationToken cancellationToken);
}

internal sealed record TenantImpersonationOperationResult(
    bool Succeeded,
    TenantImpersonationStatusResponse? Status,
    TenantImpersonationFailure? Failure)
{
    public static TenantImpersonationOperationResult Success(TenantImpersonationStatusResponse status) =>
        new(true, status, null);

    public static TenantImpersonationOperationResult Failed(TenantImpersonationFailure failure) =>
        new(false, null, failure);
}

internal sealed record TenantImpersonationStatusResponse(
    bool IsImpersonating,
    TenantImpersonationUserResponse Actor,
    TenantImpersonationUserResponse Effective);

internal sealed record TenantImpersonationUserResponse(
    Guid UserId,
    string Email,
    string Role);

internal sealed class PaperBinderImpersonationService(
    ITenantMembershipLookupService tenantMembershipLookupService,
    ITenantImpersonationAuditService tenantImpersonationAuditService,
    UserManager<PaperBinderUser> userManager,
    SignInManager<PaperBinderUser> signInManager,
    ITransactionScopeRunner transactionScopeRunner,
    PaperBinder.Application.Time.ISystemClock clock,
    PaperBinderCsrfCookieService csrfCookieService,
    IOptions<IdentityOptions> identityOptions,
    IOptionsMonitor<CookieAuthenticationOptions> cookieAuthenticationOptions)
    : IPaperBinderImpersonationService
{
    public async Task<TenantImpersonationStatusResponse> GetStatusAsync(
        TenantContext tenant,
        IRequestExecutionUserContext executionUserContext,
        TenantMembership effectiveMembership,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenant);
        ArgumentNullException.ThrowIfNull(executionUserContext);
        ArgumentNullException.ThrowIfNull(effectiveMembership);

        var actorMembership = executionUserContext.IsImpersonated
            ? await tenantMembershipLookupService.FindMembershipAsync(
                executionUserContext.ActorUserId,
                tenant.TenantId,
                cancellationToken)
            : effectiveMembership;

        if (actorMembership is null)
        {
            throw new InvalidOperationException("Actor membership was not found for the current tenant impersonation session.");
        }

        return await BuildStatusAsync(
            actorMembership,
            effectiveMembership,
            executionUserContext.IsImpersonated,
            cancellationToken);
    }

    public async Task<TenantImpersonationOperationResult> StartAsync(
        HttpContext context,
        TenantContext tenant,
        TenantMembership effectiveMembership,
        IRequestExecutionUserContext executionUserContext,
        Guid targetUserId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(tenant);
        ArgumentNullException.ThrowIfNull(effectiveMembership);
        ArgumentNullException.ThrowIfNull(executionUserContext);

        if (executionUserContext.IsImpersonated)
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.AlreadyActive,
                    "Stop the current impersonation session before starting another one."));
        }

        if (!TenantRoleAuthorization.Satisfies(effectiveMembership.Role, TenantRole.TenantAdmin))
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.AccessDenied,
                    "Only tenant admins can start tenant-local impersonation."));
        }

        if (targetUserId == Guid.Empty)
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.TargetUserIdInvalid,
                    "The request must include a non-empty impersonation target user id."));
        }

        if (targetUserId == executionUserContext.ActorUserId)
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.SelfTargetRejected,
                    "A tenant admin cannot start impersonation for the same actor user."));
        }

        var targetMembership = await tenantMembershipLookupService.FindMembershipAsync(
            targetUserId,
            tenant.TenantId,
            cancellationToken);

        if (targetMembership is null)
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.TargetUserNotFound,
                    "The requested impersonation target does not exist in the current tenant."));
        }

        if (!TryGetActorSecurityStamp(context.User, out var actorSecurityStamp))
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.SessionConflict,
                    "The current tenant session is stale. Sign in again before retrying impersonation."));
        }

        if (!await TryRotateActorSecurityStampAsync(
                executionUserContext.ActorUserId,
                actorSecurityStamp,
                cancellationToken))
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.SessionConflict,
                    "The current tenant session changed before impersonation could start. Refresh and retry."));
        }

        var actorUser = await RequireUserAsync(executionUserContext.ActorUserId, cancellationToken);
        var sessionId = Guid.NewGuid();

        await signInManager.SignInWithClaimsAsync(
            actorUser,
            isPersistent: false,
            PaperBinderImpersonationClaims.Create(targetMembership.UserId, sessionId));
        csrfCookieService.IssueToken(context);

        var auditAppended = await tenantImpersonationAuditService.TryAppendAsync(
            new TenantImpersonationAuditEvent(
                sessionId,
                TenantImpersonationAuditEventNames.Started,
                tenant.TenantId,
                executionUserContext.ActorUserId,
                targetMembership.UserId,
                clock.UtcNow,
                ResolveCorrelationId(context)),
            cancellationToken);

        if (!auditAppended)
        {
            await signInManager.SignOutAsync();
            csrfCookieService.ClearToken(context);
            throw new InvalidOperationException("The impersonation start audit event could not be recorded.");
        }

        var status = await BuildStatusAsync(
            effectiveMembership,
            targetMembership,
            isImpersonating: true,
            cancellationToken);

        return TenantImpersonationOperationResult.Success(status);
    }

    public async Task<TenantImpersonationOperationResult> StopAsync(
        HttpContext context,
        TenantContext tenant,
        TenantMembership effectiveMembership,
        IRequestExecutionUserContext executionUserContext,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(tenant);
        ArgumentNullException.ThrowIfNull(effectiveMembership);
        ArgumentNullException.ThrowIfNull(executionUserContext);

        if (!executionUserContext.IsImpersonated || !executionUserContext.ImpersonationSessionId.HasValue)
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.NotActive,
                    "There is no active tenant impersonation session to stop."));
        }

        if (!TryGetActorSecurityStamp(context.User, out var actorSecurityStamp))
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.SessionConflict,
                    "The current tenant session is stale. Sign in again before retrying impersonation."));
        }

        if (!await TryRotateActorSecurityStampAsync(
                executionUserContext.ActorUserId,
                actorSecurityStamp,
                cancellationToken))
        {
            return TenantImpersonationOperationResult.Failed(
                new TenantImpersonationFailure(
                    TenantImpersonationFailureKind.SessionConflict,
                    "The current tenant session changed before impersonation could stop. Refresh and retry."));
        }

        var actorMembership = await tenantMembershipLookupService.FindMembershipAsync(
            executionUserContext.ActorUserId,
            tenant.TenantId,
            cancellationToken);

        if (actorMembership is null)
        {
            throw new InvalidOperationException("Actor membership was not found while stopping tenant impersonation.");
        }

        var actorUser = await RequireUserAsync(executionUserContext.ActorUserId, cancellationToken);
        await signInManager.SignInAsync(actorUser, isPersistent: false);
        csrfCookieService.IssueToken(context);

        var auditAppended = await tenantImpersonationAuditService.TryAppendAsync(
            new TenantImpersonationAuditEvent(
                executionUserContext.ImpersonationSessionId.Value,
                TenantImpersonationAuditEventNames.Ended,
                tenant.TenantId,
                executionUserContext.ActorUserId,
                executionUserContext.EffectiveUserId,
                clock.UtcNow,
                ResolveCorrelationId(context)),
            cancellationToken);

        if (!auditAppended)
        {
            await signInManager.SignOutAsync();
            csrfCookieService.ClearToken(context);
            throw new InvalidOperationException("The impersonation end audit event could not be recorded.");
        }

        var status = await BuildStatusAsync(
            actorMembership,
            actorMembership,
            isImpersonating: false,
            cancellationToken);

        return TenantImpersonationOperationResult.Success(status);
    }

    public async Task<bool> TryRecordExpiredImpersonationAsync(
        HttpContext context,
        ResolvedTenantHost tenantHost,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(tenantHost);

        var ticket = TryReadTicket(context);
        if (ticket is null ||
            ticket.Principal.Identity?.IsAuthenticated != true ||
            ticket.Properties.ExpiresUtc is null ||
            ticket.Properties.ExpiresUtc > clock.UtcNow ||
            !PaperBinderAuthenticatedUser.TryGetUserId(ticket.Principal, out var actorUserId) ||
            !PaperBinderImpersonationClaims.TryGetState(ticket, out var effectiveUserId, out var sessionId))
        {
            return false;
        }

        var targetMembership = await tenantMembershipLookupService.FindMembershipAsync(
            effectiveUserId,
            tenantHost.Tenant.TenantId,
            cancellationToken);

        if (targetMembership is null)
        {
            return false;
        }

        var auditAppended = await tenantImpersonationAuditService.TryAppendAsync(
            new TenantImpersonationAuditEvent(
                sessionId,
                TenantImpersonationAuditEventNames.Ended,
                tenantHost.Tenant.TenantId,
                actorUserId,
                effectiveUserId,
                clock.UtcNow,
                ResolveCorrelationId(context)),
            cancellationToken);

        await context.SignOutAsync(IdentityConstants.ApplicationScheme);
        csrfCookieService.ClearToken(context);

        return auditAppended;
    }

    private async Task<TenantImpersonationStatusResponse> BuildStatusAsync(
        TenantMembership actorMembership,
        TenantMembership effectiveMembership,
        bool isImpersonating,
        CancellationToken cancellationToken)
    {
        var actorUser = await RequireUserAsync(actorMembership.UserId, cancellationToken);
        var effectiveUser = actorMembership.UserId == effectiveMembership.UserId
            ? actorUser
            : await RequireUserAsync(effectiveMembership.UserId, cancellationToken);

        return new TenantImpersonationStatusResponse(
            isImpersonating,
            new TenantImpersonationUserResponse(
                actorMembership.UserId,
                actorUser.Email,
                actorMembership.Role.ToString()),
            new TenantImpersonationUserResponse(
                effectiveMembership.UserId,
                effectiveUser.Email,
                effectiveMembership.Role.ToString()));
    }

    private async Task<bool> TryRotateActorSecurityStampAsync(
        Guid actorUserId,
        string principalSecurityStamp,
        CancellationToken cancellationToken)
    {
        return await transactionScopeRunner.ExecuteAsync(
            async (connection, transaction, innerCancellationToken) =>
            {
                var currentSecurityStamp = await connection.QuerySingleOrDefaultAsync<string>(
                    new Dapper.CommandDefinition(
                        """
                        select security_stamp
                        from users
                        where id = @ActorUserId
                        for update;
                        """,
                        new { ActorUserId = actorUserId },
                        transaction,
                        cancellationToken: innerCancellationToken));

                if (string.IsNullOrWhiteSpace(currentSecurityStamp) ||
                    !SecurityStampsMatch(principalSecurityStamp, currentSecurityStamp))
                {
                    return false;
                }

                await connection.ExecuteAsync(
                    new Dapper.CommandDefinition(
                        """
                        update users
                        set security_stamp = @SecurityStamp
                        where id = @ActorUserId;
                        """,
                        new
                        {
                            ActorUserId = actorUserId,
                            SecurityStamp = Guid.NewGuid().ToString("N")
                        },
                        transaction,
                        cancellationToken: innerCancellationToken));

                return true;
            },
            cancellationToken: cancellationToken);
    }

    private AuthenticationTicket? TryReadTicket(HttpContext context)
    {
        var options = cookieAuthenticationOptions.Get(IdentityConstants.ApplicationScheme);
        var cookieName = options.Cookie.Name;
        if (string.IsNullOrWhiteSpace(cookieName) ||
            !context.Request.Cookies.TryGetValue(cookieName, out var rawCookieValue) ||
            string.IsNullOrWhiteSpace(rawCookieValue))
        {
            return null;
        }

        return options.TicketDataFormat.Unprotect(rawCookieValue);
    }

    private bool TryGetActorSecurityStamp(ClaimsPrincipal principal, out string securityStamp) =>
        PaperBinderAuthenticatedUser.TryGetSecurityStamp(
            principal,
            identityOptions.Value.ClaimsIdentity.SecurityStampClaimType,
            out securityStamp);

    private static bool SecurityStampsMatch(string left, string right)
    {
        var leftBytes = System.Text.Encoding.UTF8.GetBytes(left);
        var rightBytes = System.Text.Encoding.UTF8.GetBytes(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private async Task<PaperBinderUser> RequireUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString("D"));
        return user ?? throw new InvalidOperationException($"The persisted user {userId:D} could not be loaded.");
    }

    private static string ResolveCorrelationId(HttpContext context) =>
        PaperBinderRequestCorrelation.Get(context)
        ?? Guid.NewGuid().ToString("N");
}
