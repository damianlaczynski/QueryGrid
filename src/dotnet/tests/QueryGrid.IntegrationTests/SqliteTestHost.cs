using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace QueryGrid.IntegrationTests;

internal sealed class SqliteTestHost : IAsyncDisposable
{
  private readonly SqliteConnection _connection;

  private SqliteTestHost(SearchTestDbContext context, SqliteConnection connection)
  {
    Context = context;
    _connection = connection;
  }

  public SearchTestDbContext Context { get; }

  public static async Task<SqliteTestHost> CreateSeededAsync(CancellationToken cancellationToken)
  {
    var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync(cancellationToken);

    var options = new DbContextOptionsBuilder<SearchTestDbContext>()
      .UseSqlite(connection)
      .Options;

    var context = new SearchTestDbContext(options);
    await context.Database.EnsureCreatedAsync(cancellationToken);
    await SearchTestData.SeedAsync(context);
    await SearchTestData.SeedAppointmentsAsync(context);

    return new SqliteTestHost(context, connection);
  }

  public async ValueTask DisposeAsync()
  {
    await Context.DisposeAsync();
    await _connection.DisposeAsync();
  }
}
