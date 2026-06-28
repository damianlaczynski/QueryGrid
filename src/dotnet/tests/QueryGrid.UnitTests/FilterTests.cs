using QueryGrid.Abstractions;
using QueryGrid.Core;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class FilterTests
{
  private static int[] FilteredIds(FilterNode filter)
    => TestData.Query().ApplyGridFilter(WithFilter(filter)).OrderBy(p => p.Id).Select(p => p.Id).ToArray();

  [Fact]
  public void Eq_on_number()
  {
    Assert.Equal([2], FilteredIds(Cond("Age", FilterOperator.Eq, 40)));
  }

  [Fact]
  public void Ne_on_number()
  {
    Assert.Equal([1, 3, 4], FilteredIds(Cond("Age", FilterOperator.Ne, 40)));
  }

  [Fact]
  public void Gt_and_Gte()
  {
    Assert.Equal([2, 4], FilteredIds(Cond("Age", FilterOperator.Gt, 30)));
    Assert.Equal([1, 2, 4], FilteredIds(Cond("Age", FilterOperator.Gte, 30)));
  }

  [Fact]
  public void Lt_on_decimal()
  {
    Assert.Equal([3], FilteredIds(Cond("Salary", FilterOperator.Lt, 5000m)));
  }

  [Fact]
  public void Between_is_inclusive()
  {
    Assert.Equal([1, 2, 4], FilteredIds(Cond("Age", FilterOperator.Between, new object[] { 30, 40 })));
  }

  [Fact]
  public void Contains_is_case_insensitive()
  {
    Assert.Equal([1, 3, 4], FilteredIds(Cond("Name", FilterOperator.Contains, "A")));
  }

  [Fact]
  public void StartsWith_is_case_insensitive()
  {
    Assert.Equal([1], FilteredIds(Cond("Name", FilterOperator.StartsWith, "A")));
  }

  [Fact]
  public void EndsWith_matches_suffix()
  {
    Assert.Equal([1, 4], FilteredIds(Cond("Email", FilterOperator.EndsWith, "example.com")));
  }

  [Fact]
  public void In_matches_any()
  {
    Assert.Equal([1, 3], FilteredIds(Cond("Id", FilterOperator.In, new object[] { 1, 3 })));
  }

  [Fact]
  public void NotIn_excludes_listed()
  {
    Assert.Equal([2, 4], FilteredIds(Cond("Id", FilterOperator.NotIn, new object[] { 1, 3 })));
  }

  [Fact]
  public void IsNull_and_IsNotNull_on_nullable()
  {
    Assert.Equal([3], FilteredIds(Cond("Email", FilterOperator.IsNull)));
    Assert.Equal([1, 2, 4], FilteredIds(Cond("Email", FilterOperator.IsNotNull)));
  }

  [Fact]
  public void Eq_on_enum_by_name()
  {
    Assert.Equal([1, 4], FilteredIds(Cond("Status", FilterOperator.Eq, "Active")));
  }

  [Fact]
  public void Eq_on_enum_by_numeric_value()
  {
    Assert.Equal([1, 4], FilteredIds(Cond("Status", FilterOperator.Eq, (int)PersonStatus.Active)));
  }

  [Fact]
  public void Eq_on_guid_from_string()
  {
    Assert.Equal([2], FilteredIds(Cond("ExternalId", FilterOperator.Eq, TestData.Guid2.ToString())));
  }

  [Fact]
  public void Eq_on_bool()
  {
    Assert.Equal([1, 3, 4], FilteredIds(Cond("IsActive", FilterOperator.Eq, true)));
  }

  [Fact]
  public void Eq_on_datetime_from_iso_string()
  {
    Assert.Equal([1], FilteredIds(Cond("CreatedAt", FilterOperator.Eq, "2024-01-01")));
  }

  [Fact]
  public void And_group_combines_conditions()
  {
    var filter = Group(
      FilterLogic.And,
      Cond("IsActive", FilterOperator.Eq, true),
      Cond("Age", FilterOperator.Gte, 30));
    Assert.Equal([1, 4], FilteredIds(filter));
  }

  [Fact]
  public void Or_group_combines_conditions()
  {
    var filter = Group(
      FilterLogic.Or,
      Cond("Age", FilterOperator.Lt, 26),
      Cond("Age", FilterOperator.Gt, 39));
    Assert.Equal([2, 3], FilteredIds(filter));
  }

  [Fact]
  public void Nested_groups_are_supported()
  {
    var filter = Group(
      FilterLogic.And,
      Cond("IsActive", FilterOperator.Eq, true),
      Group(
        FilterLogic.Or,
        Cond("Name", FilterOperator.StartsWith, "a"),
        Cond("Name", FilterOperator.StartsWith, "d")));
    Assert.Equal([1, 4], FilteredIds(filter));
  }
}
