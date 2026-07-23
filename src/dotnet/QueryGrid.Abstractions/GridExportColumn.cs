namespace QueryGrid.Abstractions;

/// <summary>A single column included in a grid export.</summary>
public sealed class GridExportColumn
{
  /// <summary>Row field name (must exist on the exported row type).</summary>
  public string Field { get; set; } = "";

  /// <summary>Header label written as the first CSV row.</summary>
  public string Header { get; set; } = "";
}
