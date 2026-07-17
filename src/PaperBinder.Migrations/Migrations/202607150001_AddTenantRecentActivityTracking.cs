using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
[Migration("202607150001_AddTenantRecentActivityTracking")]
public partial class AddTenantRecentActivityTracking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "last_authenticated_activity_at_utc",
            table: "tenants",
            type: "timestamp with time zone",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "last_authenticated_activity_at_utc",
            table: "tenants");
    }
}
