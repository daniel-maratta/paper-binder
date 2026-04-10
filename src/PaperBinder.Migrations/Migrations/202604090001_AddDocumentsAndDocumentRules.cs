using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PaperBinder.Infrastructure.Persistence;

#nullable disable

namespace PaperBinder.Migrations.Migrations;

[DbContext(typeof(PaperBinderDbContext))]
[Migration("202604090001_AddDocumentsAndDocumentRules")]
public partial class AddDocumentsAndDocumentRules : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "documents",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                binder_id = table.Column<Guid>(type: "uuid", nullable: false),
                title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                content_type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                content = table.Column<string>(type: "text", nullable: false),
                supersedes_document_id = table.Column<Guid>(type: "uuid", nullable: true),
                created_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                archived_at_utc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_documents", record => record.id);
                table.UniqueConstraint("ak_documents_tenant_id_id", record => new { record.tenant_id, record.id });
                table.UniqueConstraint("ak_documents_tenant_id_binder_id_id", record => new { record.tenant_id, record.binder_id, record.id });
                table.ForeignKey(
                    name: "fk_documents_tenant_id_binder_id",
                    columns: record => new { record.tenant_id, record.binder_id },
                    principalTable: "binders",
                    principalColumns: new[] { "tenant_id", "id" },
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "fk_documents_tenant_id_binder_id_supersedes_document_id",
                    columns: record => new { record.tenant_id, record.binder_id, record.supersedes_document_id },
                    principalTable: "documents",
                    principalColumns: new[] { "tenant_id", "binder_id", "id" });
                table.CheckConstraint(
                    "ck_documents_title_not_blank",
                    "char_length(btrim(title)) > 0");
                table.CheckConstraint(
                    "ck_documents_content_type_markdown",
                    "content_type = 'markdown'");
                table.CheckConstraint(
                    "ck_documents_content_not_blank",
                    "char_length(btrim(content)) > 0");
                table.CheckConstraint(
                    "ck_documents_content_length_valid",
                    "char_length(content) <= 50000");
                table.CheckConstraint(
                    "ck_documents_supersedes_not_self",
                    "supersedes_document_id is null or supersedes_document_id <> id");
            });

        migrationBuilder.CreateIndex(
            name: "ix_documents_tenant_id_created_at_utc_id",
            table: "documents",
            columns: new[] { "tenant_id", "created_at_utc", "id" });

        migrationBuilder.CreateIndex(
            name: "ix_documents_tenant_id_binder_id_archived_at_utc_created_at_utc_id",
            table: "documents",
            columns: new[] { "tenant_id", "binder_id", "archived_at_utc", "created_at_utc", "id" });

        migrationBuilder.CreateIndex(
            name: "ix_documents_tenant_id_binder_id_supersedes_document_id",
            table: "documents",
            columns: new[] { "tenant_id", "binder_id", "supersedes_document_id" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "documents");
    }
}
