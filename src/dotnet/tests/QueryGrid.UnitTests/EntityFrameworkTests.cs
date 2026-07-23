using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.EntityFrameworkCore;
using System.Text;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class EntityFrameworkTests
{
  private sealed class TestDbContext(DbContextOptions<TestDbContext> options) : DbContext(options)
  {
    public DbSet<Person> People => Set<Person>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      modelBuilder.Entity<Person>().Ignore(p => p.Tags);
    }
  }

  private static TestDbContext NewInMemoryContext()
  {
    var options = new DbContextOptionsBuilder<TestDbContext>()
      .UseInMemoryDatabase(Guid.NewGuid().ToString())
      .Options;

    var context = new TestDbContext(options);
    context.People.AddRange(TestData.People());
    context.SaveChanges();
    return context;
  }

  private static async Task<(TestDbContext Context, SqliteConnection Connection)> NewSqliteContextAsync()
  {
    var connection = new SqliteConnection("DataSource=:memory:");
    await connection.OpenAsync(TestContext.Current.CancellationToken);

    var options = new DbContextOptionsBuilder<TestDbContext>()
      .UseSqlite(connection)
      .Options;

    var context = new TestDbContext(options);
    await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
    context.People.AddRange(TestData.People());
    await context.SaveChangesAsync(TestContext.Current.CancellationToken);
    return (context, connection);
  }

  [Fact]
  public async Task ToGridResultAsync_executes_filter_sort_and_paging()
  {
    await using var context = NewInMemoryContext();

    var query = new GridQuery
    {
      Filter = Cond("Age", FilterOperator.Gte, 30),
      Sort = [new SortDescriptor("Age", desc: true)],
      Take = 2
    };

    var result = await context.People.ToGridResultAsync(query, cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal(3, result.TotalCount);
    Assert.Equal(2, result.Take);
    Assert.Equal([2, 1], result.Items.Select(p => p.Id).ToArray());
  }

  [Fact]
  public async Task ToGridResultAsync_applies_default_page_size()
  {
    await using var context = NewInMemoryContext();

    var result = await context.People.ToGridResultAsync(
      new GridQuery(), cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal(4, result.TotalCount);
    Assert.Equal(4, result.Items.Count);
  }

  [Fact]
  public async Task Sqlite_Contains_filter_is_case_insensitive_and_server_translated()
  {
    var (context, connection) = await NewSqliteContextAsync();
    await using (context)
    await using (connection)
    {
      var result = await context.People.ToGridResultAsync(
        new GridQuery { Filter = Cond("Email", FilterOperator.Contains, "EXAMPLE.COM") },
        cancellationToken: TestContext.Current.CancellationToken);

      Assert.Equal([1, 4], result.Items.Select(p => p.Id).OrderBy(id => id).ToArray());
    }
  }

  [Fact]
  public async Task Sqlite_Search_is_case_insensitive_and_server_translated()
  {
    var (context, connection) = await NewSqliteContextAsync();
    await using (context)
    await using (connection)
    {
      var result = await context.People.ToGridResultAsync(
        new GridQuery { Search = "BOB" },
        cancellationToken: TestContext.Current.CancellationToken);

      Assert.Equal([2], result.Items.Select(p => p.Id).ToArray());
    }
  }

  [Fact]
  public async Task ExportToCsvAsync_exports_filtered_rows()
  {
    await using var context = NewInMemoryContext();

    var request = new GridExportRequest
    {
      Query = new GridQuery
      {
        Filter = Cond("Age", FilterOperator.Gte, 30),
        Sort = [new SortDescriptor("Age", desc: true)]
      },
      Columns =
      [
        new GridExportColumn { Field = "Id", Header = "ID" },
        new GridExportColumn { Field = "Name", Header = "Name" }
      ]
    };

    await using var stream = new MemoryStream();
    var result = await context.People.ExportToCsvAsync(
      request,
      stream,
      exportOptions: new GridExportOptions { IncludeUtf8Bom = false },
      cancellationToken: TestContext.Current.CancellationToken);

    var csv = Encoding.UTF8.GetString(stream.ToArray());
    Assert.Equal(3, result.TotalMatchingCount);
    Assert.Equal(3, result.ExportedRowCount);
    Assert.StartsWith("ID,Name", csv, StringComparison.Ordinal);
    Assert.Contains("2,Bob", csv, StringComparison.Ordinal);
    Assert.DoesNotContain("Charlie", csv, StringComparison.Ordinal);
  }
}
