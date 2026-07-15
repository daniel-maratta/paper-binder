namespace PaperBinder.Infrastructure.Tenancy;

internal static class TenantUserAdministrationSql
{
    public const string ListUsers =
        """
        select
            u.id as UserId,
            u.email as Email,
            ut.role as Role,
            ut.is_owner as IsOwner
        from user_tenants ut
        inner join users u on u.id = ut.user_id
        where ut.tenant_id = @TenantId
        order by u.normalized_email;
        """;

    public const string InsertUser =
        """
        insert into users (
            id,
            user_name,
            normalized_user_name,
            email,
            normalized_email,
            email_confirmed,
            password_hash,
            security_stamp)
        values (
            @Id,
            @UserName,
            @NormalizedUserName,
            @Email,
            @NormalizedEmail,
            @EmailConfirmed,
            @PasswordHash,
            @SecurityStamp);
        """;

    public const string InsertTenantMembership =
        """
        insert into user_tenants (
            user_id,
            tenant_id,
            role,
            is_owner)
        values (
            @UserId,
            @TenantId,
            @Role,
            @IsOwner);
        """;

    public const string SelectTenantUserForUpdate =
        """
        select
            u.id as UserId,
            u.email as Email,
            ut.role as Role,
            ut.is_owner as IsOwner
        from user_tenants ut
        inner join users u on u.id = ut.user_id
        where ut.tenant_id = @TenantId
          and ut.user_id = @UserId
        for update of ut;
        """;

    public const string SelectTenantAdminIdsForUpdate =
        """
        select user_id
        from user_tenants
        where tenant_id = @TenantId
          and role = @Role
        for update;
        """;

    public const string SelectTenantOwnerIdsForUpdate =
        """
        select user_id
        from user_tenants
        where tenant_id = @TenantId
          and is_owner = true
        for update;
        """;

    public const string UpdateTenantUserRole =
        """
        update user_tenants
        set role = @Role
        where tenant_id = @TenantId
          and user_id = @UserId;
        """;

    public const string DeleteTenantUser =
        """
        delete from users u
        using user_tenants ut
        where u.id = ut.user_id
          and ut.tenant_id = @TenantId
          and ut.user_id = @UserId;
        """;
}
