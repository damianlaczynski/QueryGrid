using QueryGrid.Abstractions;
using QueryGrid.Core;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

/// <summary>
/// Behavioral tests for odd but realistic client payloads — what users and UIs actually send.
/// </summary>
public class GridUserExperienceTests
{
  [Fact]
  public void Filter_field_names_are_case_insensitive()
  {
    Assert.Equal([2], FilteredIds(Cond("nAmE", FilterOperator.Eq, "Bob")));
  }

  [Fact]
  public void Sort_field_names_are_case_insensitive()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("nAmE")] };
    var names = TestData.Query().ApplyGridSort(query).Select(p => p.Name).ToArray();
    Assert.Equal(["Alice", "Bob", "Charlie", "dave"], names);
  }

  [Fact]
  public void Enum_filter_accepts_lowercase_name()
  {
    Assert.Equal([1, 4], FilteredIds(Cond("Status", FilterOperator.Eq, "active")));
  }

  [Fact]
  public void Empty_in_list_matches_nothing()
  {
    Assert.Empty(FilteredIds(Cond("Status", FilterOperator.In, Array.Empty<object>())));
  }

  [Fact]
  public void Whitespace_search_does_not_narrow_results()
  {
    var query = new GridQuery
    {
      Search = "   ",
      Filter = Cond("IsActive", FilterOperator.Eq, true),
    };

    var ids = TestData.Query()
      .ApplyGridFilterAndSearch(query)
      .OrderBy(p => p.Id)
      .Select(p => p.Id)
      .ToArray();

    Assert.Equal([1, 3, 4], ids);
  }

  [Fact]
  public void Boolean_filter_accepts_string_true()
  {
    Assert.Equal([1, 3, 4], FilteredIds(Cond("IsActive", FilterOperator.Eq, "true")));
  }

  [Fact]
  public void Guid_filter_accepts_braced_guid_string()
  {
    var value = $"{{{TestData.Guid1}}}";
    Assert.Equal([1], FilteredIds(Cond("ExternalId", FilterOperator.Eq, value)));
  }
}
