using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Schema;

namespace QueryGrid.UnitTests;

public enum WorkflowStatus
{
  Cancelled = 0,
  Scheduled = 10,
  Completed = 20,
}

public sealed class SortExtensionsRow
{
  public int Id { get; set; }

  [GridEnumOrder(WorkflowStatus.Scheduled, WorkflowStatus.Completed, WorkflowStatus.Cancelled)]
  public WorkflowStatus Status { get; set; }

  [GridSortWith(nameof(ReceptionTime))]
  public DateOnly ReceptionDate { get; set; }

  public TimeOnly ReceptionTime { get; set; }

  [GridSortKey(nameof(PriorityRank))]
  public string PriorityLabel { get; set; } = string.Empty;

  [GridIgnore]
  public int PriorityRank { get; set; }
}

public static class SortExtensionsTestData
{
  public static List<SortExtensionsRow> Rows() =>
  [
    new SortExtensionsRow
    {
      Id = 1,
      Status = WorkflowStatus.Scheduled,
      ReceptionDate = new DateOnly(2024, 6, 1),
      ReceptionTime = new TimeOnly(10, 0),
      PriorityLabel = "High",
      PriorityRank = 3,
    },
    new SortExtensionsRow
    {
      Id = 2,
      Status = WorkflowStatus.Cancelled,
      ReceptionDate = new DateOnly(2024, 6, 1),
      ReceptionTime = new TimeOnly(8, 0),
      PriorityLabel = "Low",
      PriorityRank = 1,
    },
    new SortExtensionsRow
    {
      Id = 3,
      Status = WorkflowStatus.Completed,
      ReceptionDate = new DateOnly(2024, 6, 2),
      ReceptionTime = new TimeOnly(7, 0),
      PriorityLabel = "Medium",
      PriorityRank = 2,
    },
    new SortExtensionsRow
    {
      Id = 4,
      Status = WorkflowStatus.Scheduled,
      ReceptionDate = new DateOnly(2024, 6, 2),
      ReceptionTime = new TimeOnly(6, 0),
      PriorityLabel = "High",
      PriorityRank = 3,
    },
  ];

  public static IQueryable<SortExtensionsRow> Query() => Rows().AsQueryable();
}

public class SortExtensionTests
{
  [Fact]
  public void GridEnumOrder_sorts_by_business_rank_not_numeric_enum_value()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("Status")] };
    var ids = SortExtensionsTestData.Query().ApplyGridSort(query).Select(r => r.Id).ToArray();
    Assert.Equal([1, 4, 3, 2], ids);
  }

  [Fact]
  public void GridSortWith_appends_companion_with_same_direction()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("ReceptionDate")] };
    var ids = SortExtensionsTestData.Query().ApplyGridSort(query).Select(r => r.Id).ToArray();
    Assert.Equal([2, 1, 4, 3], ids);
  }

  [Fact]
  public void GridSortWith_companion_uses_descending_when_primary_is_descending()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("ReceptionDate", desc: true)] };
    var ids = SortExtensionsTestData.Query().ApplyGridSort(query).Select(r => r.Id).ToArray();
    Assert.Equal([3, 4, 1, 2], ids);
  }

  [Fact]
  public void GridSortKey_sorts_by_referenced_property()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("PriorityLabel")] };
    var ids = SortExtensionsTestData.Query().ApplyGridSort(query).Select(r => r.Id).ToArray();
    Assert.Equal([2, 3, 1, 4], ids);
  }

  [Fact]
  public void ToGridResult_includes_sort_companions_in_effective_sort()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("ReceptionDate")] };
    var result = SortExtensionsTestData.Query().ToGridResult(query);

    Assert.Equal(3, result.Sort.Count);
    Assert.Equal("ReceptionDate", result.Sort[0].Field);
    Assert.Equal("ReceptionTime", result.Sort[1].Field);
    Assert.Equal("Id", result.Sort[2].Field);
  }

  [Fact]
  public void Schema_rejects_GridEnumOrder_on_non_enum_property()
  {
    Assert.Throws<InvalidOperationException>(() => GridSchemaProvider.GetSchema<InvalidEnumOrderRow>());
  }

  [Fact]
  public void Schema_rejects_unknown_GridSortKey_target()
  {
    Assert.Throws<InvalidOperationException>(() => GridSchemaProvider.GetSchema<InvalidSortKeyRow>());
  }

  [Fact]
  public void Schema_rejects_unknown_GridSortWith_companion()
  {
    Assert.Throws<InvalidOperationException>(() => GridSchemaProvider.GetSchema<InvalidSortWithRow>());
  }
}

public sealed class InvalidEnumOrderRow
{
  public int Id { get; set; }

  [GridEnumOrder(1, 2)]
  public string Name { get; set; } = string.Empty;
}

public sealed class InvalidSortKeyRow
{
  public int Id { get; set; }

  [GridSortKey("Missing")]
  public string Label { get; set; } = string.Empty;
}

public sealed class InvalidSortWithRow
{
  public int Id { get; set; }

  [GridSortWith("Missing")]
  public DateOnly Day { get; set; }
}
