using Dapper;
using Npgsql;
using PaperBinder.Infrastructure.Persistence;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class MigrationWorkflowIntegrationTests(PostgresContainerFixture postgres)
{
    [Fact]
    public async Task Should_ApplyBaselineSchema_When_MigrationRunnerTargetsEmptyDatabase()
    {
        await using var database = await postgres.CreateDatabaseAsync(applyMigrations: false);

        var appliedMigrations = await PaperBinderDatabaseMigrator.ApplyMigrationsAsync(database.ConnectionString);
        var secondRunMigrations = await PaperBinderDatabaseMigrator.ApplyMigrationsAsync(database.ConnectionString);

        await using var connection = new NpgsqlConnection(database.ConnectionString);
        await connection.OpenAsync();

        var tenantsTableExists = await connection.ExecuteScalarAsync<bool>(
            """
            select exists (
                select 1
                from information_schema.tables
                where table_schema = 'public'
                  and table_name = 'tenants');
            """);

        var migrationId = await connection.QuerySingleAsync<string>(
            """
            select "MigrationId"
            from "__EFMigrationsHistory";
            """);

        Assert.Single(appliedMigrations);
        Assert.Empty(secondRunMigrations);
        Assert.True(tenantsTableExists);
        Assert.Contains("InitialSchema", migrationId);
    }
}
