using QueryGrid.Abstractions;
using QueryGrid.Core;

namespace QueryGrid.UnitTests;

/// <summary>Terse helpers for composing filter trees in tests.</summary>
public static class TestFilters
{
  public static FilterCondition Cond(string field, FilterOperator op, object? value = null)
    => new() { Field = field, Operator = op, Value = value };

  public static FilterGroup Group(FilterLogic logic, params FilterNode[] nodes)
    => new() { Logic = logic, Conditions = [.. nodes] };

  public static GridQuery WithFilter(FilterNode filter)
    => new() { Filter = filter };

  public static int[] FilteredIds(FilterNode filter)
    => TestData.Query().ApplyGridFilterAndSearch(WithFilter(filter)).OrderBy(p => p.Id).Select(p => p.Id).ToArray();
}
