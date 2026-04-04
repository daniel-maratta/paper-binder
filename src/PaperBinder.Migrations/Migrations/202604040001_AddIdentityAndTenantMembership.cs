using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
[Migration("202604040001_AddIdentityAndTenantMembership")]
public partial class AddIdentityAndTenantMembership : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                normalized_user_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                normalized_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                password_hash = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                security_stamp = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_users", record => record.id);
            });

        migrationBuilder.CreateTable(
            name: "user_tenants",
            columns: table => new
            {
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                is_owner = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_user_tenants", record => new { record.user_id, record.tenant_id });
                table.ForeignKey(
                    name: "fk_user_tenants_tenant_id",
                    column: record => record.tenant_id,
                    principalTable: "tenants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "fk_user_tenants_user_id",
                    column: record => record.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.CheckConstraint(
                    "ck_user_tenants_role_valid",
                    "role in ('TenantAdmin', 'BinderWrite', 'BinderRead')");
            });

        migrationBuilder.CreateIndex(
            name: "ix_user_tenants_tenant_id",
            table: "user_tenants",
            column: "tenant_id");

        migrationBuilder.CreateIndex(
            name: "ux_user_tenants_user_id",
            table: "user_tenants",
            column: "user_id",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_users_normalized_email",
            table: "users",
            column: "normalized_email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_users_normalized_user_name",
            table: "users",
            column: "normalized_user_name",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "user_tenants");

        migrationBuilder.DropTable(
            name: "users");
    }
}
