namespace QueryGrid.Core;

/// <summary>
/// Engine configuration: paging defaults and the safety limits that guard against
/// abusive or accidentally expensive queries.
/// </summary>
public sealed class GridOptions
{
  /// <summary>The shared default instance used when no options are supplied.</summary>
  public static GridOptions Default { get; } = new();

  /// <summary>Page size applied when <see cref="Abstractions.GridQuery.Take"/> is not specified. Default 20.</summary>
  public int DefaultPageSize { get; set; } = 20;

  /// <summary>Maximum number of rows that may be requested in a single page. Default 100.</summary>
  public int MaxTake { get; set; } = 100;

  /// <summary>Maximum nesting depth of the filter tree. Default 5.</summary>
  public int MaxFilterDepth { get; set; } = 5;

  /// <summary>Maximum total number of leaf conditions across the whole filter tree. Default 50.</summary>
  public int MaxConditions { get; set; } = 50;

  /// <summary>Maximum number of elements allowed in an <c>in</c>/<c>notIn</c> list. Default 200.</summary>
  public int MaxInListLength { get; set; } = 200;

  /// <summary>Maximum number of sort descriptors that may be applied. Default 5.</summary>
  public int MaxSortDescriptors { get; set; } = 5;
}
