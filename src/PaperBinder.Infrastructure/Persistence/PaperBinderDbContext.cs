using Microsoft.EntityFrameworkCore;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class PaperBinderDbContext(DbContextOptions<PaperBinderDbContext> options) : DbContext(options)
{
    internal DbSet<TenantStorageModel> Tenants => Set<TenantStorageModel>();

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
    }
}
