using Microsoft.EntityFrameworkCore;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class PaperBinderDbContext(DbContextOptions<PaperBinderDbContext> options) : DbContext(options)
{
    internal DbSet<TenantStorageModel> Tenants => Set<TenantStorageModel>();
    internal DbSet<UserStorageModel> Users => Set<UserStorageModel>();
    internal DbSet<UserTenantMembershipStorageModel> UserTenants => Set<UserTenantMembershipStorageModel>();

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
    }
}
