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

  [Fact]
  public void Trims_string_filter_values()
  {
    Assert.Equal([1], FilteredIds(Cond("Name", FilterOperator.Eq, " Alice ")));
  }

  [Fact]
  public void Whitespace_only_string_on_nullable_field_is_treated_as_null()
  {
    Assert.Equal([3], FilteredIds(Cond("Email", FilterOperator.Eq, "   ")));
  }

  [Fact]
  public void Trims_enum_name_before_parsing()
  {
    Assert.Equal([1, 4], FilteredIds(Cond("Status", FilterOperator.Eq, " Active ")));
  }
}
