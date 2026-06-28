using QueryGrid.Abstractions;

namespace QueryGrid.Core.Schema;

/// <summary>
/// The discovered set of fields for a row type. Field lookups are case-insensitive.
/// </summary>
public sealed class GridSchema
{
  private readonly IReadOnlyDictionary<string, GridFieldInfo> _fieldsByName;

  /// <summary>The row type this schema describes.</summary>
  public Type RowType { get; }

  /// <summary>All discovered fields.</summary>
  public IReadOnlyList<GridFieldInfo> Fields { get; }

  /// <summary>The fields that participate in free-text search.</summary>
  public IReadOnlyList<GridFieldInfo> SearchableFields { get; }

  internal GridSchema(Type rowType, IReadOnlyList<GridFieldInfo> fields)
  {
    RowType = rowType;
    Fields = fields;
    SearchableFields = fields.Where(f => f.IsSearchable).ToList();
    _fieldsByName = fields.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);
  }

  /// <summary>Looks up a field by name (case-insensitive). Returns <see langword="null"/> when not found.</summary>
  public GridFieldInfo? Find(string name)
    => _fieldsByName.TryGetValue(name, out var field) ? field : null;

  /// <summary>Looks up a field by name or throws <see cref="GridValidationException"/> when it is unknown.</summary>
  public GridFieldInfo Require(string name)
    => Find(name) ?? throw new GridValidationException(
      "unknown_field", $"Field '{name}' does not exist on '{RowType.Name}'.");
}
