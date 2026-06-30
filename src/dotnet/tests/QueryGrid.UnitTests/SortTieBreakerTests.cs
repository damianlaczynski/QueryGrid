using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Schema;

namespace QueryGrid.UnitTests;

public class SortTieBreakerTests
{
  [Fact]
  public void Appends_Id_as_final_sort_when_not_already_present()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Age")] };
    var ids = TestData.Query().ApplyGridSort(query).Select(p => p.Id).ToArray();
    Assert.Equal([3, 1, 4, 2], ids);
  }

  [Fact]
  public void Tie_breaker_orders_equal_sort_keys_by_Id()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Age")] };
    var ids = TestData.Query()
      .Where(p => p.Age == 30)
      .ApplyGridSort(query)
      .Select(p => p.Id)
      .ToArray();

    Assert.Equal([1, 4], ids);
  }

  [Fact]
  public void Does_not_duplicate_Id_when_already_sorted()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Id", desc: true)] };
    var ids = TestData.Query().ApplyGridSort(query).Select(p => p.Id).ToArray();
    Assert.Equal([4, 3, 2, 1], ids);
  }

  [Fact]
  public void ToGridResult_Sort_includes_implicit_Id_tie_breaker()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Age")] };
    var result = TestData.Query().ToGridResult(query);

    Assert.Equal(2, result.Sort.Count);
    Assert.Equal("Age", result.Sort[0].Field);
    Assert.False(result.Sort[0].Desc);
    Assert.Equal(GridSchemaProvider.GetSchema<Person>().SortTieBreakerField?.Name, result.Sort[1].Field);
    Assert.False(result.Sort[1].Desc);
  }

  [Fact]
  public void Honors_GridSortTieBreaker_attribute()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Label")] };
    var result = TieBreakerTestData.Query().ToGridResult(query);

    Assert.Equal(2, result.Sort.Count);
    Assert.Equal("Label", result.Sort[0].Field);
    Assert.Equal("Code", result.Sort[1].Field);
  }
}
