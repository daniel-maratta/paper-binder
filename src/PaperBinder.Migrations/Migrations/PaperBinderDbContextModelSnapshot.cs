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

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.BinderStorageModel", builder =>
        {
            builder.Property<Guid>("Id")
                .ValueGeneratedNever()
                .HasColumnType("uuid")
                .HasColumnName("id");

            builder.Property<DateTimeOffset>("CreatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at_utc");

            builder.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)")
                .HasColumnName("name");

            builder.Property<Guid>("TenantId")
                .HasColumnType("uuid")
                .HasColumnName("tenant_id");

            builder.HasKey("Id")
                .HasName("pk_binders");

            builder.HasAlternateKey("TenantId", "Id")
                .HasName("ak_binders_tenant_id_id");

            builder.HasIndex("TenantId", "CreatedAtUtc", "Id")
                .HasDatabaseName("ix_binders_tenant_id_created_at_utc_id");

            builder.ToTable(
                "binders",
                null,
                tableBuilder => tableBuilder.HasCheckConstraint(
                    "ck_binders_name_not_blank",
                    "char_length(btrim(name)) > 0"));
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.BinderPolicyStorageModel", builder =>
        {
            builder.Property<Guid>("TenantId")
                .HasColumnType("uuid")
                .HasColumnName("tenant_id");

            builder.Property<Guid>("BinderId")
                .HasColumnType("uuid")
                .HasColumnName("binder_id");

            builder.Property<string[]>("AllowedRoles")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasColumnType("text[]")
                .HasColumnName("allowed_roles")
                .HasDefaultValueSql("'{}'::text[]");

            builder.Property<DateTimeOffset>("CreatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at_utc");

            builder.Property<string>("Mode")
                .IsRequired()
                .HasMaxLength(32)
                .HasColumnType("character varying(32)")
                .HasColumnName("mode");

            builder.Property<DateTimeOffset>("UpdatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at_utc");

            builder.HasKey("TenantId", "BinderId")
                .HasName("pk_binder_policies");

            builder.ToTable(
                "binder_policies",
                null,
                tableBuilder =>
                {
                    tableBuilder.HasCheckConstraint(
                        "ck_binder_policies_allowed_roles_valid",
                        "allowed_roles <@ ARRAY['TenantAdmin', 'BinderWrite', 'BinderRead']::text[]");
                    tableBuilder.HasCheckConstraint(
                        "ck_binder_policies_mode_valid",
                        "mode in ('inherit', 'restricted_roles')");
                    tableBuilder.HasCheckConstraint(
                        "ck_binder_policies_payload_valid",
                        "((mode = 'inherit' and cardinality(allowed_roles) = 0) or (mode = 'restricted_roles' and cardinality(allowed_roles) > 0))");
                });
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.UserStorageModel", builder =>
        {
            builder.Property<Guid>("Id")
                .ValueGeneratedNever()
                .HasColumnType("uuid")
                .HasColumnName("id");

            builder.Property<string>("Email")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)")
                .HasColumnName("email");

            builder.Property<bool>("EmailConfirmed")
                .HasColumnType("boolean")
                .HasColumnName("email_confirmed");

            builder.Property<string>("NormalizedEmail")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)")
                .HasColumnName("normalized_email");

            builder.Property<string>("NormalizedUserName")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)")
                .HasColumnName("normalized_user_name");

            builder.Property<string>("PasswordHash")
                .IsRequired()
                .HasMaxLength(1024)
                .HasColumnType("character varying(1024)")
                .HasColumnName("password_hash");

            builder.Property<string>("SecurityStamp")
                .IsRequired()
                .HasMaxLength(128)
                .HasColumnType("character varying(128)")
                .HasColumnName("security_stamp");

            builder.Property<string>("UserName")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)")
                .HasColumnName("user_name");

            builder.HasKey("Id")
                .HasName("pk_users");

            builder.HasIndex("NormalizedEmail")
                .IsUnique()
                .HasDatabaseName("ux_users_normalized_email");

            builder.HasIndex("NormalizedUserName")
                .IsUnique()
                .HasDatabaseName("ux_users_normalized_user_name");

            builder.ToTable("users");
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.UserTenantMembershipStorageModel", builder =>
        {
            builder.Property<Guid>("UserId")
                .HasColumnType("uuid")
                .HasColumnName("user_id");

            builder.Property<Guid>("TenantId")
                .HasColumnType("uuid")
                .HasColumnName("tenant_id");

            builder.Property<bool>("IsOwner")
                .HasColumnType("boolean")
                .HasColumnName("is_owner");

            builder.Property<string>("Role")
                .IsRequired()
                .HasMaxLength(32)
                .HasColumnType("character varying(32)")
                .HasColumnName("role");

            builder.HasKey("UserId", "TenantId")
                .HasName("pk_user_tenants");

            builder.HasIndex("TenantId")
                .HasDatabaseName("ix_user_tenants_tenant_id");

            builder.HasIndex("UserId")
                .IsUnique()
                .HasDatabaseName("ux_user_tenants_user_id");

            builder.ToTable(
                "user_tenants",
                null,
                tableBuilder => tableBuilder.HasCheckConstraint(
                    "ck_user_tenants_role_valid",
                    "role in ('TenantAdmin', 'BinderWrite', 'BinderRead')"));
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.UserTenantMembershipStorageModel", builder =>
        {
            builder.HasOne("PaperBinder.Infrastructure.Persistence.TenantStorageModel", null)
                .WithMany()
                .HasForeignKey("TenantId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired()
                .HasConstraintName("fk_user_tenants_tenant_id");

            builder.HasOne("PaperBinder.Infrastructure.Persistence.UserStorageModel", null)
                .WithMany()
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired()
                .HasConstraintName("fk_user_tenants_user_id");
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.BinderPolicyStorageModel", builder =>
        {
            builder.HasOne("PaperBinder.Infrastructure.Persistence.BinderStorageModel", null)
                .WithMany()
                .HasForeignKey("TenantId", "BinderId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired()
                .HasPrincipalKey("TenantId", "Id")
                .HasConstraintName("fk_binder_policies_tenant_id_binder_id");
        });

        modelBuilder.Entity("PaperBinder.Infrastructure.Persistence.BinderStorageModel", builder =>
        {
            builder.HasOne("PaperBinder.Infrastructure.Persistence.TenantStorageModel", null)
                .WithMany()
                .HasForeignKey("TenantId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired()
                .HasConstraintName("fk_binders_tenant_id");
        });
#pragma warning restore 612, 618
    }
}
