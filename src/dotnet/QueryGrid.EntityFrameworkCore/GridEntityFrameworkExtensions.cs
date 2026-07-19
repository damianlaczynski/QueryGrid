using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Internal;
using QueryGrid.EntityFrameworkCore.Internal;

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
    options = EfGridOptions.WithProviderSearch(source, options);

    var plan = GridResultExecutor.Plan(source, query, options);
    var totalCount = await plan.FilteredQuery.CountAsync(cancellationToken).ConfigureAwait(false);
    var items = await plan.PageQuery.ToListAsync(cancellationToken).ConfigureAwait(false);

    return new GridResult<T>(items, totalCount, plan.Skip, plan.Take, plan.EffectiveSort);
  }
}
