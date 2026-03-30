using PaperBinder.Infrastructure.Configuration;

namespace PaperBinder.Migrations;

internal static class MigrationConnectionStringResolver
{
    public static string Resolve(string[] args)
    {
        if (args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
        {
            return args[0];
        }

        var environmentConnectionString = Environment.GetEnvironmentVariable(PaperBinderConfigurationKeys.DbConnection);
        if (!string.IsNullOrWhiteSpace(environmentConnectionString))
        {
            return environmentConnectionString;
        }

        throw new InvalidOperationException(
            $"PaperBinder migrations require a PostgreSQL connection string via the first CLI argument or `{PaperBinderConfigurationKeys.DbConnection}`.");
    }
}
