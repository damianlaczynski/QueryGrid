using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.EntityFrameworkCore;

namespace QueryGrid.IntegrationTests;

public sealed class PostgreSqlSortExtensionTests(PostgreSqlFixture fixture) : PostgreSqlTestBase(fixture)
{
  [Fact]
  public async Task GridEnumOrder_translates_to_postgres_order_by()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAppointmentsAsync(context);

    var result = await ProjectAppointments(context)
      .ToGridResultAsync(
        new GridQuery { Take = 10, Sort = [new SortDescriptor("Status")] },
        cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal([1, 4, 3, 2], result.Items.Select(i => i.Id).ToArray());
  }

  [Fact]
  public async Task GridSortWith_translates_to_postgres_then_by()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAppointmentsAsync(context);

    var result = await ProjectAppointments(context)
      .ToGridResultAsync(
        new GridQuery { Take = 10, Sort = [new SortDescriptor("ReceptionDate")] },
        cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal([2, 1, 4, 3], result.Items.Select(i => i.Id).ToArray());
  }

  [Fact]
  public async Task GridSortKey_translates_to_postgres_order_by_hidden_rank()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAppointmentsAsync(context);

    var result = await ProjectAppointments(context)
      .ToGridResultAsync(
        new GridQuery { Take = 10, Sort = [new SortDescriptor("PriorityLabel")] },
        cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal([2, 3, 1, 4], result.Items.Select(i => i.Id).ToArray());
  }

  [Fact]
  public async Task Nullable_enum_is_null_filter_translates_to_postgres()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAppointmentsAsync(context);

    var result = await ProjectAppointments(context)
      .ToGridResultAsync(
        new GridQuery
        {
          Take = 10,
          Filter = new FilterCondition
          {
            Field = "OptionalStatus",
            Operator = FilterOperator.IsNull,
          },
        },
        cancellationToken: TestContext.Current.CancellationToken);

    Assert.Equal([2], result.Items.Select(i => i.Id).ToArray());
  }

  private static IQueryable<AppointmentListRow> ProjectAppointments(SearchTestDbContext context)
    => context.Appointments.AsNoTracking()
      .Select(a => new AppointmentListRow
      {
        Id = a.Id,
        Status = a.Status,
        OptionalStatus = a.OptionalStatus,
        ReceptionDate = a.ReceptionDate,
        ReceptionTime = a.ReceptionTime,
        PriorityLabel = a.PriorityLabel,
        PriorityRank = a.PriorityRank,
      });
}
