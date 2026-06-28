using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

internal static class GridResultExecutor
{
  internal readonly record struct GridResultPlan<T>(
    IQueryable<T> FilteredQuery,
    IQueryable<T> PageQuery,
    int Skip,
    int Take,
    IReadOnlyList<SortDescriptor> EffectiveSort);

  public static GridResultPlan<T> Plan<T>(IQueryable<T> source, GridQuery query, GridOptions options)
  {
    var filtered = source.ApplyGridFilterAndSearch(query, options);
    var (skip, take) = GridQueryableExtensions.ResolvePaging(query, options);
    var schema = GridSchemaProvider.GetSchema<T>();
    var effectiveSort = SortExpressionBuilder.ResolveEffectiveSort(query.Sort, schema, options);
    var page = SortExpressionBuilder.ApplyEffective(filtered, effectiveSort, schema)
      .ApplyGridPaging(query, options);
    return new GridResultPlan<T>(filtered, page, skip, take, effectiveSort);
  }
}
