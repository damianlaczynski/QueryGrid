namespace QueryGrid.Core;

/// <summary>
/// Configuration for grid export: row caps, CSV formatting and selection limits.
/// Separate from <see cref="GridOptions"/> list paging limits.
/// </summary>
public sealed class GridExportOptions
{
  /// <summary>The shared default instance used when no options are supplied.</summary>
  public static GridExportOptions Default { get; } = new();

  /// <summary>Maximum number of rows written to a single export file. Default 50_000.</summary>
  public int MaxExportRows { get; set; } = 50_000;

  /// <summary>Maximum number of keys allowed in a selected-keys export. Default 10_000.</summary>
  public int MaxSelectedKeys { get; set; } = 10_000;

  /// <summary>When <see langword="true"/>, prepends a UTF-8 BOM so Excel on Windows opens the file correctly.</summary>
  public bool IncludeUtf8Bom { get; set; } = true;

  /// <summary>When <see langword="true"/>, writes a header row from column labels. Default <see langword="true"/>.</summary>
  public bool IncludeHeaders { get; set; } = true;

  /// <summary>Field delimiter for CSV output. Default comma.</summary>
  public string CsvDelimiter { get; set; } = ",";
}
