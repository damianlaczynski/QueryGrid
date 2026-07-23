using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Internal;

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

    var plan = GridResultExecutor.Plan(source, query, options);
    var totalCount = await plan.FilteredQuery.CountAsync(cancellationToken).ConfigureAwait(false);
    var items = await plan.PageQuery.ToListAsync(cancellationToken).ConfigureAwait(false);

    return new GridResult<T>(items, totalCount, plan.Skip, plan.Take, plan.EffectiveSort);
  }

  /// <summary>
  /// Applies the export plan, streams matching rows as CSV to <paramref name="output"/>,
  /// and returns export metadata (total match count and truncation flag).
  /// </summary>
  public static async Task<GridExportResult> ExportToCsvAsync<T>(
    this IQueryable<T> source,
    GridExportRequest request,
    Stream output,
    GridOptions? gridOptions = null,
    GridExportOptions? exportOptions = null,
    CancellationToken cancellationToken = default)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(request);
    ArgumentNullException.ThrowIfNull(output);

    gridOptions ??= GridOptions.Default;
    exportOptions ??= GridExportOptions.Default;

    if (request.Format != GridExportFormat.Csv)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportFormatNotSupported,
        $"Export format '{request.Format}' is not supported by CSV export.");
    }

    var plan = GridExportExecutor.Plan(source, request, gridOptions, exportOptions);
    var totalMatchingCount = await plan.FilteredQuery.CountAsync(cancellationToken).ConfigureAwait(false);
    var exportedRowCount = await CsvGridExporter.WriteAsync(
      plan.ExportQuery.AsAsyncEnumerable(),
      request.Columns.ToList(),
      plan.ExportFields,
      output,
      exportOptions,
      cancellationToken).ConfigureAwait(false);

    return new GridExportResult
    {
      TotalMatchingCount = totalMatchingCount,
      ExportedRowCount = exportedRowCount,
      Truncated = totalMatchingCount > exportOptions.MaxExportRows
    };
  }
}
