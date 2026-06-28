using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;

namespace QueryGrid.EntityFrameworkCore;

/// <summary>
/// Entity Framework Core entry points for executing a <see cref="GridQuery"/> asynchronously
/// against the database (server-side filtering, sorting, counting and paging).
/// </summary>
public static class GridEntityFrameworkExtensions
{
  /// <summary>
  /// Applies filter, search, multi-sort and paging, then asynchronously executes the total count
  /// and the current page against the underlying provider and returns a <see cref="GridResult{T}"/>.
  /// </summary>
  public static async Task<GridResult<T>> ToGridResultAsync<T>(
    this IQueryable<T> source,
    GridQuery query,
    GridOptions? options = null,
    CancellationToken cancellationToken = default)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(query);
    options ??= GridOptions.Default;

    var filtered = source.ApplyGridFilter(query, options);
    var totalCount = await filtered.CountAsync(cancellationToken).ConfigureAwait(false);
    var (skip, take) = GridQueryableExtensions.ResolvePaging(query, options);
    var effectiveSort = GridQueryableExtensions.ResolveEffectiveSort<T>(query, options);

    var page = filtered.ApplyGridSort(query, options).ApplyGridPaging(query, options);
    var items = await page.ToListAsync(cancellationToken).ConfigureAwait(false);

    return new GridResult<T>(items, totalCount, skip, take, effectiveSort);
  }
}
