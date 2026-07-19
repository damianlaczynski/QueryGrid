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
  public void Search_matches_guid_fields_by_equality()
  {
    Assert.Equal([3], Search(TestData.Guid3.ToString()));
  }

  [Fact]
  public void Search_skips_guid_fields_for_non_guid_text()
  {
    Assert.Empty(Search("33333333"));
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
  public void Search_matches_nullable_guid_fields_by_equality()
  {
    Assert.Equal([3], Search("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));
  }

  [Fact]
  public void ApplyEntitySearch_filters_before_projection()
  {
    var ids = TestData.Query()
      .ApplyEntitySearch("bob", p => p.Name, p => p.Email)
      .OrderBy(p => p.Id)
      .Select(p => p.Id)
      .ToArray();

    Assert.Equal([2], ids);
  }

  [Fact]
  public void WithoutSearch_clears_search_only()
  {
    var query = new GridQuery
    {
      Skip = 5,
      Take = 10,
      Search = "bob",
      Sort = [new SortDescriptor("Name", desc: true)],
    };

    var without = query.WithoutSearch();

    Assert.Null(without.Search);
    Assert.Equal(5, without.Skip);
    Assert.Equal(10, without.Take);
    Assert.Single(without.Sort);
  }
}
