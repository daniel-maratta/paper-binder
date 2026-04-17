using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
[Migration("202604170001_AddTenantImpersonationAuditEvents")]
public partial class AddTenantImpersonationAuditEvents : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "tenant_impersonation_audit_events",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                session_id = table.Column<Guid>(type: "uuid", nullable: false),
                event_name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                effective_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                occurred_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                correlation_id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_tenant_impersonation_audit_events", record => record.id);
                table.ForeignKey(
                    name: "fk_tenant_impersonation_audit_events_tenant_id",
                    column: record => record.tenant_id,
                    principalTable: "tenants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.CheckConstraint(
                    "ck_tenant_impersonation_audit_events_correlation_id_not_blank",
                    "char_length(btrim(correlation_id)) > 0");
                table.CheckConstraint(
                    "ck_tenant_impersonation_audit_events_event_name_valid",
                    "event_name in ('ImpersonationStarted', 'ImpersonationEnded')");
            });

        migrationBuilder.CreateIndex(
            name: "ix_tenant_impersonation_audit_events_tenant_id_occurred_at_utc_id",
            table: "tenant_impersonation_audit_events",
            columns: new[] { "tenant_id", "occurred_at_utc", "id" });

        migrationBuilder.CreateIndex(
            name: "ux_tenant_impersonation_audit_events_session_id_event_name",
            table: "tenant_impersonation_audit_events",
            columns: new[] { "session_id", "event_name" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "tenant_impersonation_audit_events");
    }
}
