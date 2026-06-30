using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Internal;

namespace QueryGrid.Core.Schema;

/// <summary>
/// Describes a single discovered field on a row type: its property, whether it may be sorted,
/// filtered or searched, and which operators it accepts.
/// </summary>
public sealed class GridFieldInfo
{
  /// <summary>The case-insensitive field name exposed over the wire (the property name).</summary>
  public required string Name { get; init; }

  /// <summary>The backing CLR property.</summary>
  public required PropertyInfo Property { get; init; }

  /// <summary>The property's CLR type (may be a <see cref="Nullable{T}"/>).</summary>
  public required Type ClrType { get; init; }

  /// <summary>Whether the field can be used in sort descriptors.</summary>
  public required bool CanSort { get; init; }

  /// <summary>Whether the field can be used in filter conditions.</summary>
  public required bool CanFilter { get; init; }

  /// <summary>Whether the field participates in free-text search.</summary>
  public required bool IsSearchable { get; init; }

  /// <summary>The set of operators valid for this field, derived from its type and nullability.</summary>
  public required IReadOnlySet<FilterOperator> AllowedOperators { get; init; }

  /// <summary>Whether this field is the explicit sort tie-breaker via <see cref="GridSortTieBreakerAttribute"/>.</summary>
  public required bool IsSortTieBreaker { get; init; }

  internal FieldCategory Category { get; init; }
}
