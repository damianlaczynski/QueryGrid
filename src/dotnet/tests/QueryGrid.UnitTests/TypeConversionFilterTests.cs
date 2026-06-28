using QueryGrid.Abstractions;
using QueryGrid.Core;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class TypeConversionFilterTests
{
  [Fact]
  public void Eq_on_date_only_from_string()
  {
    Assert.Equal([1], FilteredIds(Cond("RegisteredOn", FilterOperator.Eq, "2024-01-15")));
  }

  [Fact]
  public void Eq_on_time_only_from_string()
  {
    Assert.Equal([1], FilteredIds(Cond("ShiftStart", FilterOperator.Eq, "09:00:00")));
  }

  [Fact]
  public void Eq_on_time_span_from_string()
  {
    Assert.Equal([1], FilteredIds(Cond("SessionLength", FilterOperator.Eq, "02:00:00")));
  }

  [Fact]
  public void Eq_on_date_time_offset_from_string()
  {
    Assert.Equal([1], FilteredIds(Cond("UpdatedAt", FilterOperator.Eq, "2024-01-01T08:00:00+00:00")));
  }
}
