namespace PaperBinder.Infrastructure.Binders;

internal static class BinderSql
{
    public const string ListVisibleBinders =
        """
        select
            b.id as BinderId,
            b.name as Name,
            b.created_at_utc as CreatedAtUtc
        from binders b
        inner join binder_policies bp
            on bp.tenant_id = b.tenant_id
           and bp.binder_id = b.id
        where b.tenant_id = @TenantId
          and (
                bp.mode = @InheritMode
                or (
                    bp.mode = @RestrictedRolesMode
                    and bp.allowed_roles @> @AllowedRoles
                )
              )
        order by b.created_at_utc, b.id;
        """;

    public const string InsertBinder =
        """
        insert into binders (
            id,
            tenant_id,
            name,
            created_at_utc)
        values (
            @BinderId,
            @TenantId,
            @Name,
            @CreatedAtUtc);
        """;

    public const string InsertDefaultPolicy =
        """
        insert into binder_policies (
            tenant_id,
            binder_id,
            mode,
            allowed_roles,
            created_at_utc,
            updated_at_utc)
        values (
            @TenantId,
            @BinderId,
            @Mode,
            @AllowedRoles,
            @CreatedAtUtc,
            @UpdatedAtUtc);
        """;

    public const string SelectBinderDetail =
        """
        select
            b.id as BinderId,
            b.name as Name,
            b.created_at_utc as CreatedAtUtc,
            bp.mode as Mode,
            bp.allowed_roles as AllowedRoles
        from binders b
        inner join binder_policies bp
            on bp.tenant_id = b.tenant_id
           and bp.binder_id = b.id
        where b.tenant_id = @TenantId
          and b.id = @BinderId;
        """;

    public const string SelectBinderPolicy =
        """
        select
            mode as Mode,
            allowed_roles as AllowedRoles
        from binder_policies
        where tenant_id = @TenantId
          and binder_id = @BinderId;
        """;

    public const string SelectBinderPolicyForUpdate =
        """
        select
            mode as Mode,
            allowed_roles as AllowedRoles
        from binder_policies
        where tenant_id = @TenantId
          and binder_id = @BinderId
        for update;
        """;

    public const string SelectBinderDetailForUpdate =
        """
        select
            b.id as BinderId,
            b.name as Name,
            b.created_at_utc as CreatedAtUtc,
            bp.mode as Mode,
            bp.allowed_roles as AllowedRoles
        from binders b
        inner join binder_policies bp
            on bp.tenant_id = b.tenant_id
           and bp.binder_id = b.id
        where b.tenant_id = @TenantId
          and b.id = @BinderId
        for update of b, bp;
        """;

    public const string UpdateBinderPolicy =
        """
        update binder_policies
        set mode = @Mode,
            allowed_roles = @AllowedRoles,
            updated_at_utc = @UpdatedAtUtc
        where tenant_id = @TenantId
          and binder_id = @BinderId;
        """;

    public const string UpdateBinderName =
        """
        update binders
        set name = @Name
        where tenant_id = @TenantId
          and id = @BinderId;
        """;

    public const string DeleteBinder =
        """
        delete from binders
        where tenant_id = @TenantId
          and id = @BinderId;
        """;
}
