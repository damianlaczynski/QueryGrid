using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Internal;
using QueryGrid.Export.Excel.Internal;

namespace QueryGrid.Export.Excel;

/// <summary>
/// Excel export entry points for grid data.
/// </summary>
public static class GridExcelExportExtensions
{
  /// <summary>
  /// Applies the export plan, writes matching rows as an Excel workbook to <paramref name="output"/>,
  /// and returns export metadata.
  /// </summary>
  public static async Task<GridExportResult> ExportToXlsxAsync<T>(
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

    if (request.Format != GridExportFormat.Xlsx)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportFormatNotSupported,
        $"Export format '{request.Format}' is not supported by Excel export.");
    }

    var plan = GridExportExecutor.Plan(source, request, gridOptions, exportOptions);
    var totalMatchingCount = await plan.FilteredQuery.CountAsync(cancellationToken).ConfigureAwait(false);
    var items = await plan.ExportQuery.ToListAsync(cancellationToken).ConfigureAwait(false);
    var exportedRowCount = await XlsxGridExporter.WriteAsync(
      items,
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

  /// <summary>
  /// Writes rows from an in-memory query synchronously (unit tests and non-EF providers).
  /// </summary>
  public static GridExportResult ExportToXlsx<T>(
    this IQueryable<T> source,
    GridExportRequest request,
    Stream output,
    GridOptions? gridOptions = null,
    GridExportOptions? exportOptions = null)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(request);
    ArgumentNullException.ThrowIfNull(output);

    gridOptions ??= GridOptions.Default;
    exportOptions ??= GridExportOptions.Default;

    if (request.Format != GridExportFormat.Xlsx)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportFormatNotSupported,
        $"Export format '{request.Format}' is not supported by Excel export.");
    }

    var plan = GridExportExecutor.Plan(source, request, gridOptions, exportOptions);
    var totalMatchingCount = plan.FilteredQuery.Count();
    var exportedRowCount = XlsxGridExporter.Write(
      plan.ExportQuery,
      request.Columns.ToList(),
      plan.ExportFields,
      output,
      exportOptions);

    return new GridExportResult
    {
      TotalMatchingCount = totalMatchingCount,
      ExportedRowCount = exportedRowCount,
      Truncated = totalMatchingCount > exportOptions.MaxExportRows
    };
  }
}
