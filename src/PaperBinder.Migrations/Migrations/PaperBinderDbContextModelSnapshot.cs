using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
partial class PaperBinderDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "10.0.4")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.TenantStorageModel", builder =>
        {
            builder.Property<Guid>("Id")
                .ValueGeneratedNever()
                .HasColumnType("uuid")
                .HasColumnName("id");

            builder.Property<DateTimeOffset>("CreatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at_utc");

            builder.Property<DateTimeOffset>("ExpiresAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("expires_at_utc");

            builder.Property<int>("LeaseExtensionCount")
                .ValueGeneratedOnAdd()
                .HasColumnType("integer")
                .HasColumnName("lease_extension_count")
                .HasDefaultValue(0);

            builder.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)")
                .HasColumnName("name");

            builder.Property<string>("Slug")
                .IsRequired()
                .HasMaxLength(80)
                .HasColumnType("character varying(80)")
                .HasColumnName("slug");

            builder.HasKey("Id")
                .HasName("pk_tenants");

            builder.HasIndex("ExpiresAtUtc")
                .HasDatabaseName("ix_tenants_expires_at_utc");

            builder.HasIndex("Slug")
                .IsUnique()
                .HasDatabaseName("ux_tenants_slug");

            builder.ToTable(
                "tenants",
                null,
                tableBuilder => tableBuilder.HasCheckConstraint(
                    "ck_tenants_lease_extension_count_non_negative",
                    "lease_extension_count >= 0"));
        });
#pragma warning restore 612, 618
    }
}
