using QueryGrid.Abstractions;
using QueryGrid.Core;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class ValidationAndLimitsTests
{
  private static GridValidationException Filter(FilterNode filter, GridOptions? options = null)
    => Assert.Throws<GridValidationException>(
      () => TestData.Query().ApplyGridFilter(WithFilter(filter), options).ToList());

  [Fact]
  public void Unknown_field_is_rejected()
  {
    Assert.Equal("unknown_field", Filter(Cond("Nope", FilterOperator.Eq, 1)).Code);
  }

  [Fact]
  public void Operator_invalid_for_type_is_rejected()
  {
    Assert.Equal("operator_not_allowed", Filter(Cond("Age", FilterOperator.Contains, "3")).Code);
  }

  [Fact]
  public void Filtering_a_disabled_field_is_rejected()
  {
    Assert.Equal("field_not_filterable", Filter(Cond("FilterDisabled", FilterOperator.Eq, "x")).Code);
  }

  [Fact]
  public void Sorting_a_disabled_field_is_rejected()
  {
    var query = new GridQuery { Sort = [new SortDescriptor("SortDisabled")] };
    var ex = Assert.Throws<GridValidationException>(
      () => TestData.Query().ApplyGridSort(query).ToList());
    Assert.Equal("field_not_sortable", ex.Code);
  }

  [Fact]
  public void Invalid_value_is_rejected()
  {
    Assert.Equal("invalid_value", Filter(Cond("Age", FilterOperator.Eq, "not-a-number")).Code);
  }

  [Fact]
  public void Page_size_above_max_is_rejected()
  {
    var options = new GridOptions { MaxTake = 2 };
    var ex = Assert.Throws<GridValidationException>(
      () => GridQueryableExtensions.ResolvePaging(new GridQuery { Take = 3 }, options));
    Assert.Equal("page_too_large", ex.Code);
  }

  [Fact]
  public void Too_many_sort_descriptors_is_rejected()
  {
    var options = new GridOptions { MaxSortDescriptors = 1 };
    var query = new GridQuery
    {
      Sort = [new SortDescriptor("Age"), new SortDescriptor("Id")]
    };
    var ex = Assert.Throws<GridValidationException>(
      () => TestData.Query().ApplyGridSort(query, options).ToList());
    Assert.Equal("too_many_sorts", ex.Code);
  }

  [Fact]
  public void In_list_above_max_is_rejected()
  {
    var options = new GridOptions { MaxInListLength = 2 };
    var filter = Cond("Id", FilterOperator.In, new object[] { 1, 2, 3 });
    Assert.Equal("in_list_too_long", Filter(filter, options).Code);
  }

  [Fact]
  public void Too_many_conditions_is_rejected()
  {
    var options = new GridOptions { MaxConditions = 2 };
    var filter = Group(
      FilterLogic.And,
      Cond("Id", FilterOperator.Eq, 1),
      Cond("Id", FilterOperator.Eq, 2),
      Cond("Id", FilterOperator.Eq, 3));
    Assert.Equal("too_many_conditions", Filter(filter, options).Code);
  }

  [Fact]
  public void Filter_too_deep_is_rejected()
  {
    var options = new GridOptions { MaxFilterDepth = 2 };
    var filter = Group(
      FilterLogic.And,
      Group(
        FilterLogic.And,
        Group(FilterLogic.And, Cond("Id", FilterOperator.Eq, 1))));
    Assert.Equal("filter_too_deep", Filter(filter, options).Code);
  }
}
