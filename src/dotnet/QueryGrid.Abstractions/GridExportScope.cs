namespace QueryGrid.Abstractions;

/// <summary>Which rows to include in a grid export.</summary>
public enum GridExportScope
{
  /// <summary>All rows matching the query filter and search (subject to export row cap).</summary>
  AllMatching,

  /// <summary>Only rows whose data key is listed in <see cref="GridExportRequest.SelectedKeys"/>.</summary>
  SelectedKeys
}
