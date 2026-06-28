using QueryGrid.Abstractions;
using QueryGrid.Core;

namespace QueryGrid.UnitTests;

public class SortAndPagingTests
{
  [Fact]
  public void Sort_ascending()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Age")] };
    var ids = TestData.Query().ApplyGridSort(query).Select(p => p.Id).ToArray();
    Assert.Equal([3, 1, 4, 2], ids);
  }

  [Fact]
  public void Sort_descending()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Age", desc: true)] };
    var ids = TestData.Query().ApplyGridSort(query).Select(p => p.Id).ToArray();
    Assert.Equal([2, 4, 1, 3], ids);
  }

  [Fact]
  public void Multi_sort_is_stable_and_ordered()
  {
    var query = new GridQuery
    {
      Sort = [new SortDescriptor("IsActive", desc: true), new SortDescriptor("Age")]
    };
    var ids = TestData.Query().ApplyGridSort(query).Select(p => p.Id).ToArray();
    Assert.Equal([3, 1, 4, 2], ids);
  }

  [Fact]
  public void Paging_applies_skip_and_take()
  {
    var query = new GridQuery { Skip = 1, Take = 2, Sort = [new SortDescriptor("Id")] };
    var ids = TestData.Query().ApplyGridSort(query).ApplyGridPaging(query).Select(p => p.Id).ToArray();
    Assert.Equal([2, 3], ids);
  }

  [Fact]
  public void ToGridResult_returns_page_and_total_count()
  {
    var query = new GridQuery
    {
      Skip = 1,
      Take = 2,
      Sort = [new SortDescriptor("Age", desc: true)]
    };

    var result = TestData.Query().ToGridResult(query);

    Assert.Equal(4, result.TotalCount);
    Assert.Equal(1, result.Skip);
    Assert.Equal(2, result.Take);
    Assert.Equal([4, 1], result.Items.Select(p => p.Id).ToArray());
  }

  [Fact]
  public void Default_page_size_applies_when_take_is_null()
  {
    var (skip, take) = GridQueryableExtensions.ResolvePaging(new GridQuery());
    Assert.Equal(0, skip);
    Assert.Equal(GridOptions.Default.DefaultPageSize, take);
  }
}
