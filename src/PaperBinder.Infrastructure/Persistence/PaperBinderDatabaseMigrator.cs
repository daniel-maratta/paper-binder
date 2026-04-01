using Microsoft.EntityFrameworkCore;
using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Infrastructure.Persistence;

public sealed class PaperBinderDatabaseMigrator(PaperBinderRuntimeSettings runtimeSettings)
{
    public Task<IReadOnlyList<string>> ApplyMigrationsAsync(CancellationToken cancellationToken = default) =>
        ApplyMigrationsAsync(runtimeSettings.Database.ConnectionString, cancellationToken);

    public static async Task<IReadOnlyList<string>> ApplyMigrationsAsync(
        string connectionString,
        CancellationToken cancellationToken = default)
    {
        await using var context = new PaperBinderDbContext(
            PaperBinderDbContextOptionsFactory.Create(connectionString));

        var pendingMigrations = (await context.Database.GetPendingMigrationsAsync(cancellationToken))
            .ToArray();

        await context.Database.MigrateAsync(cancellationToken);
        return pendingMigrations;
    }
}
