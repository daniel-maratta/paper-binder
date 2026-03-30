using PaperBinder.Infrastructure;
using PaperBinder.Infrastructure.Persistence;
using PaperBinder.Migrations;

var connectionString = MigrationConnectionStringResolver.Resolve(args);
var appliedMigrations = await PaperBinderDatabaseMigrator.ApplyMigrationsAsync(connectionString);

if (appliedMigrations.Count == 0)
{
    Console.WriteLine("PaperBinder migrations are already up to date.");
}
else
{
    Console.WriteLine($"Applied {appliedMigrations.Count} PaperBinder migration(s):");
    foreach (var migration in appliedMigrations)
    {
        Console.WriteLine($"- {migration}");
    }
}

Console.WriteLine($"Loaded infrastructure assembly: {typeof(InfrastructureAssemblyMarker).Assembly.GetName().Name}");
