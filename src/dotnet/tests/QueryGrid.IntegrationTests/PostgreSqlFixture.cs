using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace QueryGrid.IntegrationTests;

public sealed class PostgreSqlFixture : IAsyncLifetime
{
  private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
    .WithImage("postgres:16-alpine")
    .Build();

  public string ConnectionString => _container.GetConnectionString();

  public async ValueTask InitializeAsync()
  {
    await _container.StartAsync(TestContext.Current.CancellationToken);
  }

  public async ValueTask DisposeAsync()
  {
    await _container.DisposeAsync();
  }
}

[CollectionDefinition(nameof(PostgreSqlCollection))]
public sealed class PostgreSqlCollection : ICollectionFixture<PostgreSqlFixture>;

[Collection(nameof(PostgreSqlCollection))]
public abstract class PostgreSqlTestBase(PostgreSqlFixture fixture)
{
  protected async Task<SearchTestDbContext> CreateContextAsync()
  {
    var options = new DbContextOptionsBuilder<SearchTestDbContext>()
      .UseNpgsql(fixture.ConnectionString)
      .Options;

    var context = new SearchTestDbContext(options);
    await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
    return context;
  }
}
