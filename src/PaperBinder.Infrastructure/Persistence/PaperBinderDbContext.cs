using Microsoft.EntityFrameworkCore;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class PaperBinderDbContext(DbContextOptions<PaperBinderDbContext> options) : DbContext(options)
{
    internal DbSet<TenantStorageModel> Tenants => Set<TenantStorageModel>();
    internal DbSet<BinderStorageModel> Binders => Set<BinderStorageModel>();
    internal DbSet<BinderPolicyStorageModel> BinderPolicies => Set<BinderPolicyStorageModel>();
    internal DbSet<DocumentStorageModel> Documents => Set<DocumentStorageModel>();
    internal DbSet<UserStorageModel> Users => Set<UserStorageModel>();
    internal DbSet<UserTenantMembershipStorageModel> UserTenants => Set<UserTenantMembershipStorageModel>();
    internal DbSet<TenantImpersonationAuditEventStorageModel> TenantImpersonationAuditEvents =>
        Set<TenantImpersonationAuditEventStorageModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var tenant = modelBuilder.Entity<TenantStorageModel>();

        tenant.ToTable("tenants");
        tenant.HasKey(record => record.Id).HasName("pk_tenants");

        tenant.Property(record => record.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        tenant.Property(record => record.Slug)
            .HasColumnName("slug")
            .HasMaxLength(80)
            .IsRequired();

        tenant.Property(record => record.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        tenant.Property(record => record.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone");

        tenant.Property(record => record.ExpiresAtUtc)
            .HasColumnName("expires_at_utc")
            .HasColumnType("timestamp with time zone");

        tenant.Property(record => record.LeaseExtensionCount)
            .HasColumnName("lease_extension_count")
            .HasDefaultValue(0);

        tenant.HasIndex(record => record.Slug)
            .HasDatabaseName("ux_tenants_slug")
            .IsUnique();

        tenant.HasIndex(record => record.ExpiresAtUtc)
            .HasDatabaseName("ix_tenants_expires_at_utc");

        tenant.ToTable(tableBuilder =>
            tableBuilder.HasCheckConstraint(
                "ck_tenants_lease_extension_count_non_negative",
                "lease_extension_count >= 0"));

        var binder = modelBuilder.Entity<BinderStorageModel>();

        binder.ToTable("binders");
        binder.HasKey(record => record.Id).HasName("pk_binders");
        binder.HasAlternateKey(record => new { record.TenantId, record.Id }).HasName("ak_binders_tenant_id_id");

        binder.Property(record => record.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        binder.Property(record => record.TenantId)
            .HasColumnName("tenant_id");

        binder.Property(record => record.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        binder.Property(record => record.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone");

        binder.HasIndex(record => new { record.TenantId, record.CreatedAtUtc, record.Id })
            .HasDatabaseName("ix_binders_tenant_id_created_at_utc_id");

        binder.HasOne<TenantStorageModel>()
            .WithMany()
            .HasForeignKey(record => record.TenantId)
            .HasConstraintName("fk_binders_tenant_id")
            .OnDelete(DeleteBehavior.Cascade);

        binder.ToTable(tableBuilder =>
            tableBuilder.HasCheckConstraint(
                "ck_binders_name_not_blank",
                "char_length(btrim(name)) > 0"));

        var binderPolicy = modelBuilder.Entity<BinderPolicyStorageModel>();

        binderPolicy.ToTable("binder_policies");
        binderPolicy.HasKey(record => new { record.TenantId, record.BinderId }).HasName("pk_binder_policies");

        binderPolicy.Property(record => record.TenantId)
            .HasColumnName("tenant_id");

        binderPolicy.Property(record => record.BinderId)
            .HasColumnName("binder_id");

        binderPolicy.Property(record => record.Mode)
            .HasColumnName("mode")
            .HasMaxLength(32)
            .IsRequired();

        binderPolicy.Property(record => record.AllowedRoles)
            .HasColumnName("allowed_roles")
            .HasColumnType("text[]")
            .HasDefaultValueSql("'{}'::text[]");

        binderPolicy.Property(record => record.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone");

        binderPolicy.Property(record => record.UpdatedAtUtc)
            .HasColumnName("updated_at_utc")
            .HasColumnType("timestamp with time zone");

        binderPolicy.HasOne<BinderStorageModel>()
            .WithMany()
            .HasForeignKey(record => new { record.TenantId, record.BinderId })
            .HasPrincipalKey(record => new { record.TenantId, record.Id })
            .HasConstraintName("fk_binder_policies_tenant_id_binder_id")
            .OnDelete(DeleteBehavior.Cascade);

        binderPolicy.ToTable(tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_binder_policies_mode_valid",
                "mode in ('inherit', 'restricted_roles')");
            tableBuilder.HasCheckConstraint(
                "ck_binder_policies_allowed_roles_valid",
                "allowed_roles <@ ARRAY['TenantAdmin', 'BinderWrite', 'BinderRead']::text[]");
            tableBuilder.HasCheckConstraint(
                "ck_binder_policies_payload_valid",
                "((mode = 'inherit' and cardinality(allowed_roles) = 0) or (mode = 'restricted_roles' and cardinality(allowed_roles) > 0))");
        });

        var document = modelBuilder.Entity<DocumentStorageModel>();

        document.ToTable("documents");
        document.HasKey(record => record.Id).HasName("pk_documents");
        document.HasAlternateKey(record => new { record.TenantId, record.Id }).HasName("ak_documents_tenant_id_id");
        document.HasAlternateKey(record => new { record.TenantId, record.BinderId, record.Id }).HasName("ak_documents_tenant_id_binder_id_id");

        document.Property(record => record.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        document.Property(record => record.TenantId)
            .HasColumnName("tenant_id");

        document.Property(record => record.BinderId)
            .HasColumnName("binder_id");

        document.Property(record => record.Title)
            .HasColumnName("title")
            .HasMaxLength(200)
            .IsRequired();

        document.Property(record => record.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(32)
            .IsRequired();

        document.Property(record => record.Content)
            .HasColumnName("content")
            .HasColumnType("text")
            .IsRequired();

        document.Property(record => record.SupersedesDocumentId)
            .HasColumnName("supersedes_document_id");

        document.Property(record => record.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .HasColumnType("timestamp with time zone");

        document.Property(record => record.ArchivedAtUtc)
            .HasColumnName("archived_at_utc")
            .HasColumnType("timestamp with time zone");

        document.HasIndex(record => new { record.TenantId, record.CreatedAtUtc, record.Id })
            .HasDatabaseName("ix_documents_tenant_id_created_at_utc_id");

        document.HasIndex(record => new { record.TenantId, record.BinderId, record.ArchivedAtUtc, record.CreatedAtUtc, record.Id })
            .HasDatabaseName("ix_documents_tenant_id_binder_id_archived_at_utc_created_at_utc_id");

        document.HasIndex(record => new { record.TenantId, record.BinderId, record.SupersedesDocumentId })
            .HasDatabaseName("ix_documents_tenant_id_binder_id_supersedes_document_id");

        document.HasOne<BinderStorageModel>()
            .WithMany()
            .HasForeignKey(record => new { record.TenantId, record.BinderId })
            .HasPrincipalKey(record => new { record.TenantId, record.Id })
            .HasConstraintName("fk_documents_tenant_id_binder_id")
            .OnDelete(DeleteBehavior.Cascade);

        document.HasOne<DocumentStorageModel>()
            .WithMany()
            .HasForeignKey(record => new { record.TenantId, record.BinderId, record.SupersedesDocumentId })
            .HasPrincipalKey(record => new { record.TenantId, record.BinderId, record.Id })
            .HasConstraintName("fk_documents_tenant_id_binder_id_supersedes_document_id")
            .OnDelete(DeleteBehavior.NoAction);

        document.ToTable(tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_documents_title_not_blank",
                "char_length(btrim(title)) > 0");
            tableBuilder.HasCheckConstraint(
                "ck_documents_content_type_markdown",
                "content_type = 'markdown'");
            tableBuilder.HasCheckConstraint(
                "ck_documents_content_not_blank",
                "char_length(btrim(content)) > 0");
            tableBuilder.HasCheckConstraint(
                "ck_documents_content_length_valid",
                "char_length(content) <= 50000");
            tableBuilder.HasCheckConstraint(
                "ck_documents_supersedes_not_self",
                "supersedes_document_id is null or supersedes_document_id <> id");
        });

        var user = modelBuilder.Entity<UserStorageModel>();

        user.ToTable("users");
        user.HasKey(record => record.Id).HasName("pk_users");

        user.Property(record => record.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        user.Property(record => record.UserName)
            .HasColumnName("user_name")
            .HasMaxLength(256)
            .IsRequired();

        user.Property(record => record.NormalizedUserName)
            .HasColumnName("normalized_user_name")
            .HasMaxLength(256)
            .IsRequired();

        user.Property(record => record.Email)
            .HasColumnName("email")
            .HasMaxLength(256)
            .IsRequired();

        user.Property(record => record.NormalizedEmail)
            .HasColumnName("normalized_email")
            .HasMaxLength(256)
            .IsRequired();

        user.Property(record => record.EmailConfirmed)
            .HasColumnName("email_confirmed");

        user.Property(record => record.PasswordHash)
            .HasColumnName("password_hash")
            .HasMaxLength(1024)
            .IsRequired();

        user.Property(record => record.SecurityStamp)
            .HasColumnName("security_stamp")
            .HasMaxLength(128)
            .IsRequired();

        user.HasIndex(record => record.NormalizedUserName)
            .HasDatabaseName("ux_users_normalized_user_name")
            .IsUnique();

        user.HasIndex(record => record.NormalizedEmail)
            .HasDatabaseName("ux_users_normalized_email")
            .IsUnique();

        var userTenant = modelBuilder.Entity<UserTenantMembershipStorageModel>();

        userTenant.ToTable("user_tenants");
        userTenant.HasKey(record => new { record.UserId, record.TenantId }).HasName("pk_user_tenants");

        userTenant.Property(record => record.UserId)
            .HasColumnName("user_id");

        userTenant.Property(record => record.TenantId)
            .HasColumnName("tenant_id");

        userTenant.Property(record => record.Role)
            .HasColumnName("role")
            .HasMaxLength(32)
            .IsRequired();

        userTenant.Property(record => record.IsOwner)
            .HasColumnName("is_owner");

        userTenant.HasIndex(record => record.UserId)
            .HasDatabaseName("ux_user_tenants_user_id")
            .IsUnique();

        userTenant.HasIndex(record => record.TenantId)
            .HasDatabaseName("ix_user_tenants_tenant_id");

        userTenant.HasOne<UserStorageModel>()
            .WithMany()
            .HasForeignKey(record => record.UserId)
            .HasConstraintName("fk_user_tenants_user_id")
            .OnDelete(DeleteBehavior.Cascade);

        userTenant.HasOne<TenantStorageModel>()
            .WithMany()
            .HasForeignKey(record => record.TenantId)
            .HasConstraintName("fk_user_tenants_tenant_id")
            .OnDelete(DeleteBehavior.Cascade);

        userTenant.ToTable(tableBuilder =>
            tableBuilder.HasCheckConstraint(
                "ck_user_tenants_role_valid",
                "role in ('TenantAdmin', 'BinderWrite', 'BinderRead')"));

        var tenantImpersonationAuditEvent = modelBuilder.Entity<TenantImpersonationAuditEventStorageModel>();

        tenantImpersonationAuditEvent.ToTable("tenant_impersonation_audit_events");
        tenantImpersonationAuditEvent.HasKey(record => record.Id).HasName("pk_tenant_impersonation_audit_events");

        tenantImpersonationAuditEvent.Property(record => record.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        tenantImpersonationAuditEvent.Property(record => record.SessionId)
            .HasColumnName("session_id");

        tenantImpersonationAuditEvent.Property(record => record.EventName)
            .HasColumnName("event_name")
            .HasMaxLength(64)
            .IsRequired();

        tenantImpersonationAuditEvent.Property(record => record.TenantId)
            .HasColumnName("tenant_id");

        tenantImpersonationAuditEvent.Property(record => record.ActorUserId)
            .HasColumnName("actor_user_id");

        tenantImpersonationAuditEvent.Property(record => record.EffectiveUserId)
            .HasColumnName("effective_user_id");

        tenantImpersonationAuditEvent.Property(record => record.OccurredAtUtc)
            .HasColumnName("occurred_at_utc")
            .HasColumnType("timestamp with time zone");

        tenantImpersonationAuditEvent.Property(record => record.CorrelationId)
            .HasColumnName("correlation_id")
            .HasMaxLength(64)
            .IsRequired();

        tenantImpersonationAuditEvent.HasIndex(record => new { record.TenantId, record.OccurredAtUtc, record.Id })
            .HasDatabaseName("ix_tenant_impersonation_audit_events_tenant_id_occurred_at_utc_id");

        tenantImpersonationAuditEvent.HasIndex(record => new { record.SessionId, record.EventName })
            .HasDatabaseName("ux_tenant_impersonation_audit_events_session_id_event_name")
            .IsUnique();

        tenantImpersonationAuditEvent.HasOne<TenantStorageModel>()
            .WithMany()
            .HasForeignKey(record => record.TenantId)
            .HasConstraintName("fk_tenant_impersonation_audit_events_tenant_id")
            .OnDelete(DeleteBehavior.Cascade);

        tenantImpersonationAuditEvent.ToTable(tableBuilder =>
        {
            tableBuilder.HasCheckConstraint(
                "ck_tenant_impersonation_audit_events_event_name_valid",
                "event_name in ('ImpersonationStarted', 'ImpersonationEnded')");
            tableBuilder.HasCheckConstraint(
                "ck_tenant_impersonation_audit_events_correlation_id_not_blank",
                "char_length(btrim(correlation_id)) > 0");
        });
    }
}
