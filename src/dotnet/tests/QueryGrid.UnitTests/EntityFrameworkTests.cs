using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.EntityFrameworkCore;
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

  private static TestDbContext NewContext()
  {
    var options = new DbContextOptionsBuilder<TestDbContext>()
      .UseInMemoryDatabase(Guid.NewGuid().ToString())
      .Options;

    var context = new TestDbContext(options);
    context.People.AddRange(TestData.People());
    context.SaveChanges();
    return context;
  }

  [Fact]
  public async Task ToGridResultAsync_executes_filter_sort_and_paging()
  {
    await using var context = NewContext();

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
    await using var context = NewContext();

    var result = await context.People.ToGridResultAsync(
      new GridQuery(), cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal(4, result.TotalCount);
    Assert.Equal(4, result.Items.Count);
  }
}
