using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
[Migration("202604070001_AddBindersAndBinderPolicies")]
public partial class AddBindersAndBinderPolicies : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "binders",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_binders", record => record.id);
                table.UniqueConstraint("ak_binders_tenant_id_id", record => new { record.tenant_id, record.id });
                table.ForeignKey(
                    name: "fk_binders_tenant_id",
                    column: record => record.tenant_id,
                    principalTable: "tenants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.CheckConstraint(
                    "ck_binders_name_not_blank",
                    "char_length(btrim(name)) > 0");
            });

        migrationBuilder.CreateTable(
            name: "binder_policies",
            columns: table => new
            {
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                binder_id = table.Column<Guid>(type: "uuid", nullable: false),
                mode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                allowed_roles = table.Column<string[]>(type: "text[]", nullable: false, defaultValueSql: "'{}'::text[]"),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_binder_policies", record => new { record.tenant_id, record.binder_id });
                table.ForeignKey(
                    name: "fk_binder_policies_tenant_id_binder_id",
                    columns: record => new { record.tenant_id, record.binder_id },
                    principalTable: "binders",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
                table.CheckConstraint(
                    "ck_binder_policies_mode_valid",
                    "mode in ('inherit', 'restricted_roles')");
                table.CheckConstraint(
                    "ck_binder_policies_allowed_roles_valid",
                    "allowed_roles <@ ARRAY['TenantAdmin', 'BinderWrite', 'BinderRead']::text[]");
                table.CheckConstraint(
                    "ck_binder_policies_payload_valid",
                    "((mode = 'inherit' and cardinality(allowed_roles) = 0) or (mode = 'restricted_roles' and cardinality(allowed_roles) > 0))");
            });

        migrationBuilder.CreateIndex(
            name: "ix_binders_tenant_id_created_at_utc_id",
            table: "binders",
            columns: new[] { "tenant_id", "created_at_utc", "id" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "binder_policies");

        migrationBuilder.DropTable(
            name: "binders");
    }
}
