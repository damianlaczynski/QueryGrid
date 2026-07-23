using System.Globalization;
using ClosedXML.Excel;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Core.Schema;

namespace QueryGrid.Export.Excel.Internal;

internal static class XlsxGridExporter
{
  public static int Write<T>(
    IEnumerable<T> rows,
    IReadOnlyList<GridExportColumn> columns,
    IReadOnlyList<GridFieldInfo> fields,
    Stream output,
    GridExportOptions options)
  {
    ArgumentNullException.ThrowIfNull(rows);
    ArgumentNullException.ThrowIfNull(output);
    ArgumentNullException.ThrowIfNull(options);

    using var workbook = new XLWorkbook();
    var worksheet = workbook.Worksheets.Add("Export");

    var rowIndex = 1;
    if (options.IncludeHeaders)
    {
      for (var columnIndex = 0; columnIndex < columns.Count; columnIndex++)
      {
        worksheet.Cell(rowIndex, columnIndex + 1).Value = columns[columnIndex].Header;
      }

      worksheet.Row(rowIndex).Style.Font.Bold = true;
      rowIndex++;
    }

    var exportedRows = 0;
    foreach (var row in rows)
    {
      for (var columnIndex = 0; columnIndex < fields.Count; columnIndex++)
      {
        var value = fields[columnIndex].Property.GetValue(row);
        SetCellValue(worksheet.Cell(rowIndex, columnIndex + 1), value);
      }

      rowIndex++;
      exportedRows++;
    }

    worksheet.Columns().AdjustToContents();
    using var buffer = new MemoryStream();
    workbook.SaveAs(buffer);
    buffer.Position = 0;
    buffer.CopyTo(output);
    return exportedRows;
  }

  public static async Task<int> WriteAsync<T>(
    IEnumerable<T> rows,
    IReadOnlyList<GridExportColumn> columns,
    IReadOnlyList<GridFieldInfo> fields,
    Stream output,
    GridExportOptions options,
    CancellationToken cancellationToken = default)
  {
    ArgumentNullException.ThrowIfNull(rows);
    ArgumentNullException.ThrowIfNull(output);
    ArgumentNullException.ThrowIfNull(options);

    using var buffer = new MemoryStream();
    var exportedRows = Write(rows, columns, fields, buffer, options);
    buffer.Position = 0;
    await buffer.CopyToAsync(output, cancellationToken).ConfigureAwait(false);
    return exportedRows;
  }

  internal static void SetCellValue(IXLCell cell, object? value)
  {
    if (value is null)
    {
      cell.Clear(XLClearOptions.Contents);
      return;
    }

    switch (value)
    {
      case string text:
        cell.Value = text;
        return;
      case bool boolean:
        cell.Value = boolean;
        return;
      case DateTime dateTime:
        cell.Value = dateTime;
        return;
      case DateTimeOffset dateTimeOffset:
        cell.Value = dateTimeOffset.UtcDateTime;
        return;
      case DateOnly dateOnly:
        cell.Value = dateOnly.ToDateTime(TimeOnly.MinValue);
        return;
      case TimeOnly timeOnly:
        cell.Value = timeOnly.ToTimeSpan();
        return;
      case TimeSpan timeSpan:
        cell.Value = timeSpan;
        return;
      case Enum enumValue:
        cell.Value = enumValue.ToString();
        return;
      case Guid guid:
        cell.Value = guid.ToString();
        return;
      case byte or sbyte or short or ushort or int or uint or long or ulong:
        cell.Value = Convert.ToInt64(value, CultureInfo.InvariantCulture);
        return;
      case float or double or decimal:
        cell.Value = Convert.ToDouble(value, CultureInfo.InvariantCulture);
        return;
      default:
        cell.Value = Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
        return;
    }
  }
}
