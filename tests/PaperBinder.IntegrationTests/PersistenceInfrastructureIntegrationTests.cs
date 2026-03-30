using System.Data;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using PaperBinder.Application.Persistence;

namespace PaperBinder.IntegrationTests;

[Trait("Category", IntegrationTestCategories.Docker)]
[Collection(PostgresDatabaseCollection.Name)]
public sealed class PersistenceInfrastructureIntegrationTests(PostgresContainerFixture postgres)
{
    [Fact]
    public async Task Should_CommitAndReadTenantRow_When_TransactionCompletes()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await PaperBinderApplicationHost.StartAsync(database.ConnectionString);

        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        var transactionRunner = host.Application.Services.GetRequiredService<ITransactionScopeRunner>();

        var tenant = new
        {
            Id = Guid.NewGuid(),
            Slug = "cp3-baseline",
            Name = "CP3 Baseline Tenant",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(60),
            LeaseExtensionCount = 0
        };

        await transactionRunner.ExecuteAsync(
            async (connection, transaction, cancellationToken) =>
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        """
                        insert into tenants (id, slug, name, created_at_utc, expires_at_utc, lease_extension_count)
                        values (@Id, @Slug, @Name, @CreatedAtUtc, @ExpiresAtUtc, @LeaseExtensionCount);
                        """,
                        tenant,
                        transaction,
                        cancellationToken: cancellationToken));
            },
            cancellationToken: CancellationToken.None);

        await using var verificationConnection = await connectionFactory.OpenConnectionAsync();
        var storedTenant = await verificationConnection.QuerySingleAsync<StoredTenant>(
            """
            select
                id as Id,
                slug as Slug,
                name as Name,
                lease_extension_count as LeaseExtensionCount
            from tenants
            where id = @Id;
            """,
            new { tenant.Id });

        Assert.Equal(tenant.Id, storedTenant.Id);
        Assert.Equal(tenant.Slug, storedTenant.Slug);
        Assert.Equal(tenant.Name, storedTenant.Name);
        Assert.Equal(tenant.LeaseExtensionCount, storedTenant.LeaseExtensionCount);
    }

    [Fact]
    public async Task Should_RollBackTenantInsert_When_TransactionBodyThrows()
    {
        await using var database = await postgres.CreateDatabaseAsync();
        await using var host = await PaperBinderApplicationHost.StartAsync(database.ConnectionString);

        var connectionFactory = host.Application.Services.GetRequiredService<ISqlConnectionFactory>();
        var transactionRunner = host.Application.Services.GetRequiredService<ITransactionScopeRunner>();

        var tenantId = Guid.NewGuid();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => transactionRunner.ExecuteAsync(
                async (connection, transaction, cancellationToken) =>
                {
                    await connection.ExecuteAsync(
                        new CommandDefinition(
                            """
                            insert into tenants (id, slug, name, created_at_utc, expires_at_utc, lease_extension_count)
                            values (@Id, @Slug, @Name, @CreatedAtUtc, @ExpiresAtUtc, @LeaseExtensionCount);
                            """,
                            new
                            {
                                Id = tenantId,
                                Slug = "cp3-rollback",
                                Name = "Rolled Back Tenant",
                                CreatedAtUtc = DateTimeOffset.UtcNow,
                                ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(30),
                                LeaseExtensionCount = 0
                            },
                            transaction,
                            cancellationToken: cancellationToken));

                    throw new InvalidOperationException("Simulated transaction failure.");
                },
                IsolationLevel.ReadCommitted,
                CancellationToken.None));

        await using var verificationConnection = await connectionFactory.OpenConnectionAsync();
        var tenantCount = await verificationConnection.ExecuteScalarAsync<int>(
            """
            select count(*)
            from tenants
            where id = @Id;
            """,
            new { Id = tenantId });

        Assert.Equal(0, tenantCount);
    }

    private sealed record StoredTenant(
        Guid Id,
        string Slug,
        string Name,
        int LeaseExtensionCount);
}
