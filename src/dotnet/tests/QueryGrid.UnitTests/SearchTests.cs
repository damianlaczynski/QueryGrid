using QueryGrid.Abstractions;
using QueryGrid.Core;

namespace QueryGrid.UnitTests;

public class SearchTests
{
  private static int[] Search(string text)
    => TestData.Query()
      .ApplyGridFilter(new GridQuery { Search = text })
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
  public void Blank_search_returns_everything()
  {
    Assert.Equal([1, 2, 3, 4], Search("   "));
  }
}
