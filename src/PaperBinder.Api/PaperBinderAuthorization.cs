using Microsoft.AspNetCore.Authorization;
using PaperBinder.Application.Tenancy;

namespace PaperBinder.Api;

internal static class PaperBinderAuthorizationPolicyNames
{
    public const string AuthenticatedUser = "PaperBinder.AuthenticatedUser";
    public const string BinderRead = "PaperBinder.BinderRead";
    public const string BinderWrite = "PaperBinder.BinderWrite";
    public const string TenantAdmin = "PaperBinder.TenantAdmin";
}

internal static class PaperBinderAuthorizationExtensions
{
    public static IServiceCollection AddPaperBinderAuthorization(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IAuthorizationHandler, TenantMembershipAuthorizationHandler>();
        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                PaperBinderAuthorizationPolicyNames.AuthenticatedUser,
                policy => ConfigureMembershipPolicy(policy, minimumRole: null));
            options.AddPolicy(
                PaperBinderAuthorizationPolicyNames.BinderRead,
                policy => ConfigureMembershipPolicy(policy, TenantRole.BinderRead));
            options.AddPolicy(
                PaperBinderAuthorizationPolicyNames.BinderWrite,
                policy => ConfigureMembershipPolicy(policy, TenantRole.BinderWrite));
            options.AddPolicy(
                PaperBinderAuthorizationPolicyNames.TenantAdmin,
                policy => ConfigureMembershipPolicy(policy, TenantRole.TenantAdmin));
        });

        return services;
    }

    private static void ConfigureMembershipPolicy(AuthorizationPolicyBuilder policy, TenantRole? minimumRole)
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new TenantMembershipAuthorizationRequirement(minimumRole));
    }
}

internal sealed record TenantMembershipAuthorizationRequirement(TenantRole? MinimumRole)
    : IAuthorizationRequirement;

internal sealed class TenantMembershipAuthorizationHandler(IRequestTenantMembershipContext membershipContext)
    : AuthorizationHandler<TenantMembershipAuthorizationRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        TenantMembershipAuthorizationRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true ||
            !membershipContext.IsEstablished ||
            membershipContext.Membership is null)
        {
            return Task.CompletedTask;
        }

        if (requirement.MinimumRole is null ||
            TenantRoleAuthorization.Satisfies(membershipContext.Membership.Role, requirement.MinimumRole.Value))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
