using System.Text.Json.Serialization;
using QueryGrid.Abstractions.Serialization;

namespace QueryGrid.Abstractions;

/// <summary>
/// The unified transport contract describing how a data set should be paged, sorted, filtered
/// and searched. Inspired by DevExtreme's load options but expressed as plain CLR types.
/// </summary>
public sealed class GridQuery
{
  /// <summary>Number of rows to skip (offset). When <see langword="null"/> no rows are skipped.</summary>
  public int? Skip { get; set; }

  /// <summary>Maximum number of rows to return (page size). When <see langword="null"/> the engine default applies.</summary>
  public int? Take { get; set; }

  /// <summary>Ordered list of sort instructions applied as a stable multi-sort.</summary>
  public IList<SortDescriptor> Sort { get; set; } = new List<SortDescriptor>();

  /// <summary>Optional filter tree applied with AND/OR logic.</summary>
  [JsonConverter(typeof(FilterNodeJsonConverter))]
  public FilterNode? Filter { get; set; }

  /// <summary>Optional free-text search applied across the fields marked as searchable.</summary>
  public string? Search { get; set; }

  /// <summary>Parses a JSON query-string value for FastEndpoints and other model binders.</summary>
  public static bool TryParse(string? value, out GridQuery result)
  {
    if (GridQueryJson.TryDeserialize(value, out var query, out _))
    {
      result = query!;
      return true;
    }

    result = new GridQuery();
    return false;
  }
}
