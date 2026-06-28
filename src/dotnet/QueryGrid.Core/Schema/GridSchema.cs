using QueryGrid.Abstractions;

namespace QueryGrid.Core.Schema;

/// <summary>
/// The discovered set of fields for a row type. Field lookups are case-insensitive.
/// </summary>
public sealed class GridSchema
{
  private const string DefaultSortTieBreakerName = "Id";

  private readonly IReadOnlyDictionary<string, GridFieldInfo> _fieldsByName;

  /// <summary>The row type this schema describes.</summary>
  public Type RowType { get; }

  /// <summary>All discovered fields.</summary>
  public IReadOnlyList<GridFieldInfo> Fields { get; }

  /// <summary>The fields that participate in free-text search.</summary>
  public IReadOnlyList<GridFieldInfo> SearchableFields { get; }

  /// <summary>
  /// The field appended as a final ascending sort for stable ordering, when sortable and not already present.
  /// Resolved from <see cref="GridSortTieBreakerAttribute"/> or, by convention, a sortable <c>Id</c> property.
  /// </summary>
  public GridFieldInfo? SortTieBreakerField { get; }

  internal GridSchema(Type rowType, IReadOnlyList<GridFieldInfo> fields)
  {
    RowType = rowType;
    Fields = fields;
    SearchableFields = fields.Where(f => f.IsSearchable).ToList();
    _fieldsByName = fields.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);
    SortTieBreakerField = ResolveSortTieBreakerField(fields, rowType);
  }

  /// <summary>Looks up a field by name (case-insensitive). Returns <see langword="null"/> when not found.</summary>
  public GridFieldInfo? Find(string name)
    => _fieldsByName.TryGetValue(name, out var field) ? field : null;

  /// <summary>Looks up a field by name or throws <see cref="GridValidationException"/> when it is unknown.</summary>
  public GridFieldInfo Require(string name)
    => Find(name) ?? throw new GridValidationException(
      GridValidationCodes.UnknownField, $"Field '{name}' does not exist on '{RowType.Name}'.");

  private static GridFieldInfo? ResolveSortTieBreakerField(
    IReadOnlyList<GridFieldInfo> fields, Type rowType)
  {
    GridFieldInfo? explicitTieBreaker = null;

    foreach (var field in fields)
    {
      if (!field.IsSortTieBreaker)
      {
        continue;
      }

      if (explicitTieBreaker is not null)
      {
        throw new InvalidOperationException(
          $"Type '{rowType.Name}' has multiple properties marked with [GridSortTieBreaker].");
      }

      explicitTieBreaker = field;
    }

    if (explicitTieBreaker is { CanSort: true })
    {
      return explicitTieBreaker;
    }

    return fields.FirstOrDefault(field =>
      field.CanSort &&
      field.Name.Equals(DefaultSortTieBreakerName, StringComparison.OrdinalIgnoreCase));
  }
}
