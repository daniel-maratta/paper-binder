using Microsoft.EntityFrameworkCore.Design;
using PaperBinder.Infrastructure.Persistence;

namespace PaperBinder.Migrations;

public sealed class PaperBinderDesignTimeDbContextFactory : IDesignTimeDbContextFactory<PaperBinderDbContext>
{
    public PaperBinderDbContext CreateDbContext(string[] args)
    {
        var connectionString = MigrationConnectionStringResolver.Resolve(args);
        return new PaperBinderDbContext(PaperBinderDbContextOptionsFactory.Create(connectionString));
    }
}
