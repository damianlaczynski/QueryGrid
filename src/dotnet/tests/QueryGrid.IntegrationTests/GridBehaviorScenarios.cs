using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.EntityFrameworkCore;

namespace QueryGrid.IntegrationTests;

/// <summary>
/// Provider-agnostic grid behaviors that should work the same on every relational database.
/// Tests describe user-visible outcomes, not implementation details.
/// </summary>
public static class GridBehaviorScenarios
{
  public static async Task Empty_query_returns_first_page(SearchTestDbContext context, CancellationToken ct)
  {
    var result = await context.Roles.AsNoTracking()
      .ToGridResultAsync(new GridQuery(), cancellationToken: ct);

    Assert.Equal(3, result.TotalCount);
    Assert.Equal(3, result.Items.Count);
  }

  public static async Task Search_is_trimmed_and_case_insensitive(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "  LOGIN  " },
      cancellationToken: ct);

    Assert.Single(result.Items);
    Assert.Equal("Broken login", result.Items[0].Title);
  }

  public static async Task Text_contains_is_case_insensitive(SearchTestDbContext context, CancellationToken ct)
  {
    var result = await context.Roles.AsNoTracking()
      .ToGridResultAsync(
        new GridQuery
        {
          Take = 10,
          Filter = new FilterCondition
          {
            Field = "Name",
            Operator = FilterOperator.Contains,
            Value = "admin",
          },
        },
        cancellationToken: ct);

    Assert.Single(result.Items);
    Assert.Equal("Admin", result.Items[0].Name);
  }

  public static async Task Enum_filter_accepts_padded_name(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery
      {
        Take = 10,
        Filter = new FilterCondition
        {
          Field = "Status",
          Operator = FilterOperator.Eq,
          Value = " Scheduled ",
        },
      },
      cancellationToken: ct);

    Assert.Equal([1, 4], result.Items.Select(i => i.Id).OrderBy(id => id).ToArray());
  }

  public static async Task Nullable_enum_is_null_filter(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery
      {
        Take = 10,
        Filter = new FilterCondition
        {
          Field = "OptionalStatus",
          Operator = FilterOperator.IsNull,
        },
      },
      cancellationToken: ct);

    Assert.Equal([2], result.Items.Select(i => i.Id).ToArray());
  }

  public static async Task Nullable_string_whitespace_eq_matches_null_rows(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = context.Roles.AsNoTracking()
      .Select(r => new RoleListItemDto
      {
        Id = r.Id,
        Name = r.Name,
        Description = r.Description,
        PermissionCount = r.Permissions.Count,
        UserCount = 0,
        IsSystem = r.IsSystem,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery
      {
        Take = 10,
        Filter = new FilterCondition
        {
          Field = "Description",
          Operator = FilterOperator.Eq,
          Value = "   ",
        },
      },
      cancellationToken: ct);

    Assert.Equal([3], result.Items.Select(r => r.Id).ToArray());
  }

  public static async Task Enum_in_multiselect(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery
      {
        Take = 10,
        Filter = new FilterCondition
        {
          Field = "Status",
          Operator = FilterOperator.In,
          Value = new object[] { AppointmentStatus.Scheduled, AppointmentStatus.Completed },
        },
      },
      cancellationToken: ct);

    Assert.Equal([1, 3, 4], result.Items.Select(i => i.Id).OrderBy(id => id).ToArray());
  }

  public static async Task Custom_enum_sort_order(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Sort = [new SortDescriptor("Status")] },
      cancellationToken: ct);

    Assert.Equal([1, 4, 3, 2], result.Items.Select(i => i.Id).ToArray());
  }

  public static async Task Sort_companion_date_and_time(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Sort = [new SortDescriptor("ReceptionDate")] },
      cancellationToken: ct);

    Assert.Equal([2, 1, 4, 3], result.Items.Select(i => i.Id).ToArray());
  }

  public static async Task Sort_key_maps_display_field_to_rank(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = ProjectAppointments(context);

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Sort = [new SortDescriptor("PriorityLabel")] },
      cancellationToken: ct);

    Assert.Equal([2, 3, 1, 4], result.Items.Select(i => i.Id).ToArray());
  }

  public static async Task Skip_beyond_total_returns_empty_items_but_keeps_count(SearchTestDbContext context, CancellationToken ct)
  {
    var result = await context.Roles.AsNoTracking()
      .ToGridResultAsync(
        new GridQuery { Skip = 100, Take = 10, Sort = [new SortDescriptor("Id")] },
        cancellationToken: ct);

    Assert.Equal(3, result.TotalCount);
    Assert.Empty(result.Items);
    Assert.Equal(100, result.Skip);
  }

  public static async Task Or_filter_group_finds_either_value(SearchTestDbContext context, CancellationToken ct)
  {
    var result = await context.Roles.AsNoTracking()
      .ToGridResultAsync(
        new GridQuery
        {
          Take = 10,
          Filter = new FilterGroup
          {
            Logic = FilterLogic.Or,
            Conditions =
            [
              new FilterCondition { Field = "Name", Operator = FilterOperator.Eq, Value = "Admin" },
              new FilterCondition { Field = "Name", Operator = FilterOperator.Eq, Value = "Viewer" },
            ],
          },
        },
        cancellationToken: ct);

    Assert.Equal(2, result.Items.Count);
  }

  public static async Task Field_names_are_case_insensitive(SearchTestDbContext context, CancellationToken ct)
  {
    var result = await context.Roles.AsNoTracking()
      .ToGridResultAsync(
        new GridQuery
        {
          Take = 10,
          Sort = [new SortDescriptor("name", desc: true)],
          Filter = new FilterCondition
          {
            Field = "NAME",
            Operator = FilterOperator.Contains,
            Value = "view",
          },
        },
        cancellationToken: ct);

    Assert.Single(result.Items);
    Assert.Equal("Viewer", result.Items[0].Name);
  }

  public static async Task Filter_and_search_combine_with_and(SearchTestDbContext context, CancellationToken ct)
  {
    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery
      {
        Take = 10,
        Search = "login",
        Filter = new FilterCondition
        {
          Field = "Title",
          Operator = FilterOperator.Contains,
          Value = "Broken",
        },
      },
      cancellationToken: ct);

    Assert.Single(result.Items);
    Assert.Equal("Broken login", result.Items[0].Title);
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
