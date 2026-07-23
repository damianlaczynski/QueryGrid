using System.Globalization;
using System.Text;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

internal static class CsvGridExporter
{
  private static readonly UTF8Encoding Utf8WithoutBom = new(encoderShouldEmitUTF8Identifier: false);

  public static async Task<int> WriteAsync<T>(
    IAsyncEnumerable<T> rows,
    IReadOnlyList<GridExportColumn> columns,
    IReadOnlyList<GridFieldInfo> fields,
    Stream output,
    GridExportOptions options,
    CancellationToken cancellationToken = default)
  {
    ArgumentNullException.ThrowIfNull(rows);
    ArgumentNullException.ThrowIfNull(output);
    ArgumentNullException.ThrowIfNull(options);

    if (options.IncludeUtf8Bom)
    {
      await output.WriteAsync(Encoding.UTF8.GetPreamble(), cancellationToken).ConfigureAwait(false);
    }

    await using var writer = new StreamWriter(output, Utf8WithoutBom, leaveOpen: true);
    if (options.IncludeHeaders)
    {
      await writer.WriteLineAsync(FormatCsvLine(columns.Select(column => column.Header), options.CsvDelimiter))
        .ConfigureAwait(false);
    }

    var rowCount = 0;
    await foreach (var row in rows.WithCancellation(cancellationToken).ConfigureAwait(false))
    {
      var values = new string[fields.Count];
      for (var index = 0; index < fields.Count; index++)
      {
        var value = fields[index].Property.GetValue(row);
        values[index] = FormatExportValue(value);
      }

      await writer.WriteLineAsync(FormatCsvLine(values, options.CsvDelimiter)).ConfigureAwait(false);
      rowCount++;
    }

    await writer.FlushAsync(cancellationToken).ConfigureAwait(false);
    return rowCount;
  }

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

    if (options.IncludeUtf8Bom)
    {
      output.Write(Encoding.UTF8.GetPreamble());
    }

    using var writer = new StreamWriter(output, Utf8WithoutBom, leaveOpen: true);
    if (options.IncludeHeaders)
    {
      writer.WriteLine(FormatCsvLine(columns.Select(column => column.Header), options.CsvDelimiter));
    }

    var rowCount = 0;
    foreach (var row in rows)
    {
      var values = new string[fields.Count];
      for (var index = 0; index < fields.Count; index++)
      {
        var value = fields[index].Property.GetValue(row);
        values[index] = FormatExportValue(value);
      }

      writer.WriteLine(FormatCsvLine(values, options.CsvDelimiter));
      rowCount++;
    }

    writer.Flush();
    return rowCount;
  }

  internal static string FormatExportValue(object? value)
  {
    if (value is null)
    {
      return "";
    }

    return value switch
    {
      string text => text,
      bool boolean => boolean ? "true" : "false",
      DateTime dateTime => dateTime.ToString("O", CultureInfo.InvariantCulture),
      DateTimeOffset dateTimeOffset => dateTimeOffset.ToString("O", CultureInfo.InvariantCulture),
      DateOnly dateOnly => dateOnly.ToString("O", CultureInfo.InvariantCulture),
      TimeOnly timeOnly => timeOnly.ToString("O", CultureInfo.InvariantCulture),
      TimeSpan timeSpan => timeSpan.ToString("c", CultureInfo.InvariantCulture),
      Enum enumValue => enumValue.ToString(),
      IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
      _ => Convert.ToString(value, CultureInfo.InvariantCulture) ?? ""
    };
  }

  internal static string FormatCsvLine(IEnumerable<string> values, string delimiter)
    => string.Join(delimiter, values.Select(EscapeCsvField));

  internal static string EscapeCsvField(string value)
  {
    var mustQuote = value.Contains('"') || value.Contains('\n') || value.Contains('\r') || value.Contains(',');
    if (!mustQuote)
    {
      return value;
    }

    return $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
  }
}
