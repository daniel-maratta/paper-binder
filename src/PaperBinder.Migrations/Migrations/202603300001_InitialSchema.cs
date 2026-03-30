using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

public partial class InitialSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "tenants",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                slug = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                expires_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                lease_extension_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_tenants", record => record.id);
                table.CheckConstraint(
                    "ck_tenants_lease_extension_count_non_negative",
                    "lease_extension_count >= 0");
            });

        migrationBuilder.CreateIndex(
            name: "ix_tenants_expires_at_utc",
            table: "tenants",
            column: "expires_at_utc");

        migrationBuilder.CreateIndex(
            name: "ux_tenants_slug",
            table: "tenants",
            column: "slug",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "tenants");
    }
}
