using QueryGrid.Abstractions;
using QueryGrid.Core.Internal;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core;

/// <summary>
/// Entry points for applying a <see cref="GridQuery"/> to an <see cref="IQueryable{T}"/>.
/// Field discovery, value conversion, operator validation and safety limits are handled
/// automatically based on the shape of the row type.
/// </summary>
public static class GridQueryableExtensions
{
  private static GridOptions Options(GridOptions? options) => options ?? GridOptions.Default;

  /// <summary>Applies the query's filter tree and free-text search (no sorting or paging).</summary>
  public static IQueryable<T> ApplyGridFilterAndSearch<T>(this IQueryable<T> source, GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(query);
    options = Options(options);
    var schema = GridSchemaProvider.GetSchema<T>();

    var filter = FilterExpressionBuilder.Build<T>(query.Filter, schema, options);
    if (filter is not null)
    {
      source = source.Where(filter);
    }

    var search = SearchExpressionBuilder.Build<T>(query.Search, schema);
    if (search is not null)
    {
      source = source.Where(search);
    }

    return source;
  }

  /// <summary>Applies the query's multi-sort. Returns the source unchanged when no sort is requested.</summary>
  public static IQueryable<T> ApplyGridSort<T>(this IQueryable<T> source, GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(query);
    options = Options(options);
    var schema = GridSchemaProvider.GetSchema<T>();
    return SortExpressionBuilder.Apply(source, query.Sort, schema, options);
  }

  /// <summary>Applies the query's paging using the resolved skip/take.</summary>
  public static IQueryable<T> ApplyGridPaging<T>(this IQueryable<T> source, GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(query);
    var (skip, take) = ResolvePaging(query, options);
    if (skip > 0)
    {
      source = source.Skip(skip);
    }

    return source.Take(take);
  }

  /// <summary>
  /// Returns the sort descriptors the engine will apply, including implicit tie-breakers.
  /// </summary>
  public static IReadOnlyList<SortDescriptor> ResolveEffectiveSort<T>(GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(query);
    options = Options(options);
    var schema = GridSchemaProvider.GetSchema<T>();
    return SortExpressionBuilder.ResolveEffectiveSort(query.Sort, schema, options);
  }

  /// <summary>
  /// Resolves the effective skip/take from the query and options, applying the default page size
  /// and enforcing <see cref="GridOptions.MaxTake"/>.
  /// </summary>
  public static (int Skip, int Take) ResolvePaging(GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(query);
    options = Options(options);

    var take = query.Take ?? options.DefaultPageSize;
    if (take < 0)
    {
      take = 0;
    }

    if (take > options.MaxTake)
    {
      throw new GridValidationException(
        GridValidationCodes.PageTooLarge, $"Requested page size {take} exceeds the maximum of {options.MaxTake}.");
    }

    var skip = query.Skip ?? 0;
    if (skip < 0)
    {
      skip = 0;
    }

    return (skip, take);
  }

  /// <summary>
  /// Applies filter, search, sort and paging and materializes the result synchronously,
  /// including the total matching count. Use the Entity Framework Core integration for
  /// asynchronous execution.
  /// </summary>
  public static GridResult<T> ToGridResult<T>(this IQueryable<T> source, GridQuery query, GridOptions? options = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(query);
    options = Options(options);

    var plan = GridResultExecutor.Plan(source, query, options);
    return new GridResult<T>(
      plan.PageQuery.ToList(),
      plan.FilteredQuery.Count(),
      plan.Skip,
      plan.Take,
      plan.EffectiveSort);
  }
}
