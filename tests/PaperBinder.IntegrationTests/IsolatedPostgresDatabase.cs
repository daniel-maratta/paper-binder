namespace PaperBinder.IntegrationTests;

public sealed class IsolatedPostgresDatabase(
    PostgresContainerFixture owner,
    string databaseName,
    string connectionString) : IAsyncDisposable
{
    public string DatabaseName { get; } = databaseName;

    public string ConnectionString { get; } = connectionString;

    public ValueTask DisposeAsync() => new(owner.DropDatabaseAsync(DatabaseName));
}
