namespace PaperBinder.IntegrationTests;

[CollectionDefinition(Name)]
public sealed class PostgresDatabaseCollection : ICollectionFixture<PostgresContainerFixture>
{
    public const string Name = "postgres-database";
}
