using QueryGrid.Abstractions;
using QueryGrid.Core;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class SearchTests
{
  private static int[] Search(string text)
    => TestData.Query()
      .ApplyGridFilterAndSearch(new GridQuery { Search = text })
      .OrderBy(p => p.Id)
      .Select(p => p.Id)
      .ToArray();

  [Fact]
  public void Search_matches_across_searchable_fields()
  {
    Assert.Equal([1, 4], Search("example.com"));
  }

  [Fact]
  public void Search_is_case_insensitive()
  {
    Assert.Equal([2], Search("BOB"));
  }

  [Fact]
  public void Search_matches_guid_fields()
  {
    Assert.Equal([3], Search("33333333"));
  }

  [Fact]
  public void Blank_search_returns_everything()
  {
    Assert.Equal([1, 2, 3, 4], Search("   "));
  }

  [Fact]
  public void Search_combined_with_filter()
  {
    var query = new GridQuery
    {
      Search = "example.com",
      Filter = Cond("IsActive", FilterOperator.Eq, true)
    };

    var ids = TestData.Query()
      .ApplyGridFilterAndSearch(query)
      .OrderBy(p => p.Id)
      .Select(p => p.Id)
      .ToArray();

    Assert.Equal([1, 4], ids);
  }

  [Fact]
  public void Search_matches_nullable_guid_fields()
  {
    Assert.Equal([3], Search("bbbb-cccc"));
  }
}
