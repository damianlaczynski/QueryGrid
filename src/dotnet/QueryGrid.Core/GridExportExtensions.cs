using QueryGrid.Abstractions;
using QueryGrid.Core.Internal;

namespace QueryGrid.Core;

/// <summary>
/// Entry points for exporting grid data from an <see cref="IQueryable{T}"/>.
/// </summary>
public static class GridExportExtensions
{
  private static GridOptions ResolveGridOptions(GridOptions? options) => options ?? GridOptions.Default;

  private static GridExportOptions ResolveExportOptions(GridExportOptions? options) => options ?? GridExportOptions.Default;

  /// <summary>
  /// Applies filter, search, optional selected-key filter, sort and export row cap.
  /// Paging from <see cref="GridQuery.Skip"/> / <see cref="GridQuery.Take"/> is ignored.
  /// </summary>
  public static IQueryable<T> ApplyGridExport<T>(
    this IQueryable<T> source,
    GridExportRequest request,
    GridOptions? gridOptions = null,
    GridExportOptions? exportOptions = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(request);
    return GridExportExecutor.Plan(source, request, ResolveGridOptions(gridOptions), ResolveExportOptions(exportOptions)).ExportQuery;
  }

  /// <summary>
  /// Exports rows to CSV synchronously (in-memory providers). For database-backed sources use
  /// the Entity Framework Core <c>ExportToCsvAsync</c> extension.
  /// </summary>
  public static GridExportResult ExportToCsv<T>(
    this IQueryable<T> source,
    GridExportRequest request,
    Stream output,
    GridOptions? gridOptions = null,
    GridExportOptions? exportOptions = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(request);
    ArgumentNullException.ThrowIfNull(output);

    var grid = ResolveGridOptions(gridOptions);
    var export = ResolveExportOptions(exportOptions);

    if (request.Format != GridExportFormat.Csv)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportFormatNotSupported,
        $"Export format '{request.Format}' is not supported by CSV export.");
    }

    var plan = GridExportExecutor.Plan(source, request, grid, export);
    var totalMatchingCount = plan.FilteredQuery.Count();
    var exportedRowCount = CsvGridExporter.Write(
      plan.ExportQuery,
      request.Columns.ToList(),
      plan.ExportFields,
      output,
      export);

    return new GridExportResult
    {
      TotalMatchingCount = totalMatchingCount,
      ExportedRowCount = exportedRowCount,
      Truncated = totalMatchingCount > export.MaxExportRows
    };
  }
}
