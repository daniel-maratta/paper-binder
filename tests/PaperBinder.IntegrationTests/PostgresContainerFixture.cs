using Npgsql;
using PaperBinder.Infrastructure.Persistence;
using Testcontainers.PostgreSql;

namespace PaperBinder.IntegrationTests;

public sealed class PostgresContainerFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("postgres")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string AdminConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        try
        {
            await _container.StartAsync();
        }
        catch (Exception ex) when (LooksLikeDockerAvailabilityFailure(ex))
        {
            throw new InvalidOperationException(
                "Docker-backed integration tests require a working Docker daemon. Use scripts/test.ps1 -DockerIntegrationMode Auto to skip this bucket locally, or rerun with -DockerIntegrationMode Require once Docker is available.",
                ex);
        }
    }

    public async Task<IsolatedPostgresDatabase> CreateDatabaseAsync(bool applyMigrations = true)
    {
        var databaseName = $"paperbinder_it_{Guid.NewGuid():N}";

        await using var adminConnection = new NpgsqlConnection(AdminConnectionString);
        await adminConnection.OpenAsync();

        await using (var createDatabaseCommand = new NpgsqlCommand(
            $"CREATE DATABASE {databaseName};",
            adminConnection))
        {
            await createDatabaseCommand.ExecuteNonQueryAsync();
        }

        var connectionStringBuilder = new NpgsqlConnectionStringBuilder(AdminConnectionString)
        {
            Database = databaseName
        };

        var database = new IsolatedPostgresDatabase(this, databaseName, connectionStringBuilder.ConnectionString);

        if (applyMigrations)
        {
            await PaperBinderDatabaseMigrator.ApplyMigrationsAsync(database.ConnectionString);
        }

        return database;
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    internal async Task DropDatabaseAsync(string databaseName)
    {
        await using var adminConnection = new NpgsqlConnection(AdminConnectionString);
        await adminConnection.OpenAsync();

        await using (var terminateConnectionsCommand = new NpgsqlCommand(
            """
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = @databaseName
              AND pid <> pg_backend_pid();
            """,
            adminConnection))
        {
            terminateConnectionsCommand.Parameters.AddWithValue("databaseName", databaseName);
            await terminateConnectionsCommand.ExecuteNonQueryAsync();
        }

        await using var dropDatabaseCommand = new NpgsqlCommand(
            $"DROP DATABASE IF EXISTS {databaseName};",
            adminConnection);
        await dropDatabaseCommand.ExecuteNonQueryAsync();
    }

    private static bool LooksLikeDockerAvailabilityFailure(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            var message = current.Message;
            if (message.Contains("docker_engine", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("docker.sock", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("Docker daemon", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("Cannot connect to the Docker daemon", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("permission denied while trying to connect to the Docker daemon socket", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
