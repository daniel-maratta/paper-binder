using Microsoft.EntityFrameworkCore;

namespace PaperBinder.Infrastructure.Persistence;

public static class PaperBinderDbContextOptionsFactory
{
    public const string MigrationsAssemblyName = "PaperBinder.Migrations";

    public static DbContextOptions<PaperBinderDbContext> Create(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        var builder = new DbContextOptionsBuilder<PaperBinderDbContext>();
        builder.UseNpgsql(
            connectionString,
            options => options.MigrationsAssembly(MigrationsAssemblyName));

        return builder.Options;
    }
}
