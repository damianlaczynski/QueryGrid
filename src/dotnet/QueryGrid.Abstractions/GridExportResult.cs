namespace QueryGrid.Abstractions;

/// <summary>Metadata returned after a grid export completes.</summary>
public sealed class GridExportResult
{
  /// <summary>Total rows matching the export filter before the export row cap.</summary>
  public int TotalMatchingCount { get; init; }

  /// <summary>Number of rows written to the output file.</summary>
  public int ExportedRowCount { get; init; }

  /// <summary>
  /// <see langword="true"/> when <see cref="TotalMatchingCount"/> exceeds the configured export cap
  /// and only the first cap rows were written.
  /// </summary>
  public bool Truncated { get; init; }
}
