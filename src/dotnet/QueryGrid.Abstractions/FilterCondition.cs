namespace QueryGrid.Abstractions;

/// <summary>
/// A single leaf condition that compares a field against a value using a
/// <see cref="FilterOperator"/>.
/// </summary>
public sealed class FilterCondition : FilterNode
{
  /// <summary>The name of the target field, matching a discovered property on the row type.</summary>
  public string Field { get; set; } = string.Empty;

  /// <summary>The comparison operator to apply.</summary>
  public FilterOperator Operator { get; set; }

  /// <summary>
  /// The comparison value. For <see cref="FilterOperator.In"/>, <see cref="FilterOperator.NotIn"/>
  /// and <see cref="FilterOperator.Between"/> this is expected to be a list; for
  /// <see cref="FilterOperator.IsNull"/> and <see cref="FilterOperator.IsNotNull"/> it is ignored.
  /// </summary>
  public object? Value { get; set; }
}
