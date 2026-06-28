namespace QueryGrid.Abstractions;

/// <summary>
/// The result of applying a <see cref="GridQuery"/> to a data set: the current page of items
/// together with the total count and the echoed paging/sort state.
/// </summary>
/// <typeparam name="T">The row (DTO) type.</typeparam>
public sealed class GridResult<T>
{
  /// <summary>The rows for the requested page.</summary>
  public IReadOnlyList<T> Items { get; init; } = [];

  /// <summary>The total number of rows that match the filter, before paging.</summary>
  public int TotalCount { get; init; }

  /// <summary>The number of rows skipped to produce this page.</summary>
  public int Skip { get; init; }

  /// <summary>The page size that produced this result.</summary>
  public int Take { get; init; }

  /// <summary>
  /// The sort order actually applied on the server to produce this page, in priority order.
  /// This may include implicit tie-breakers (for example <c>Id</c>) that the engine appends
  /// for stable paging even when they were not present in the client request.
  /// Compare with <see cref="GridQuery.Sort"/>, which carries only what the client asked for.
  /// </summary>
  public IReadOnlyList<SortDescriptor> Sort { get; init; } = [];

  /// <summary>Creates an empty result.</summary>
  public GridResult()
  {
  }

  /// <summary>Creates a populated result.</summary>
  /// <param name="items">The page rows.</param>
  /// <param name="totalCount">The total matching row count.</param>
  /// <param name="skip">The applied skip.</param>
  /// <param name="take">The applied take.</param>
  /// <param name="sort">The applied sort.</param>
  public GridResult(IReadOnlyList<T> items, int totalCount, int skip, int take, IReadOnlyList<SortDescriptor> sort)
  {
    Items = items;
    TotalCount = totalCount;
    Skip = skip;
    Take = take;
    Sort = sort;
  }
}
