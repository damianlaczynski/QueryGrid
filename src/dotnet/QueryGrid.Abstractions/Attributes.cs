namespace QueryGrid.Abstractions;

/// <summary>
/// Excludes a property from QueryGrid entirely: it becomes neither sortable, filterable nor searchable.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridIgnoreAttribute : Attribute
{
}

/// <summary>
/// Overrides whether a property can be sorted. By default every discovered property is sortable.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSortAttribute : Attribute
{
  /// <summary>Whether the property may be used for sorting.</summary>
  public bool Enabled { get; }

  /// <summary>Creates the attribute.</summary>
  /// <param name="enabled">Set to <see langword="false"/> to disable sorting for this property.</param>
  public GridSortAttribute(bool enabled = true)
  {
    Enabled = enabled;
  }
}

/// <summary>
/// Overrides whether a property can be filtered. By default every discovered property is filterable.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridFilterAttribute : Attribute
{
  /// <summary>Whether the property may be used for filtering.</summary>
  public bool Enabled { get; }

  /// <summary>Creates the attribute.</summary>
  /// <param name="enabled">Set to <see langword="false"/> to disable filtering for this property.</param>
  public GridFilterAttribute(bool enabled = true)
  {
    Enabled = enabled;
  }
}

/// <summary>
/// Marks a text or Guid property as a target for free-text <see cref="GridQuery.Search"/>.
/// When no property is marked, search is disabled for the row type.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSearchableAttribute : Attribute
{
}

/// <summary>
/// Marks the property used as an implicit final ascending sort when multi-sort is applied.
/// When omitted, a sortable property named <c>Id</c> is used when present.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSortTieBreakerAttribute : Attribute
{
}

/// <summary>
/// Defines the business sort order for an enum property. Values are listed from lowest to highest rank.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridEnumOrderAttribute : Attribute
{
  /// <summary>Enum members in ascending sort order.</summary>
  public object[] Values { get; }

  /// <summary>Creates the attribute.</summary>
  /// <param name="values">Enum members in ascending sort order.</param>
  public GridEnumOrderAttribute(params object[] values)
  {
    ArgumentNullException.ThrowIfNull(values);
    if (values.Length == 0)
    {
      throw new ArgumentException("At least one enum value is required.", nameof(values));
    }

    Values = values;
  }
}

/// <summary>
/// Sorts this field using another property (for example a hidden rank column on a grid row DTO).
/// The wire field name stays the annotated property; only the sort key changes.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSortKeyAttribute : Attribute
{
  /// <summary>The property name used for <c>OrderBy</c> when this field is sorted.</summary>
  public string PropertyName { get; }

  /// <summary>Creates the attribute.</summary>
  /// <param name="propertyName">Sort key property on the same row type.</param>
  public GridSortKeyAttribute(string propertyName)
  {
    ArgumentException.ThrowIfNullOrWhiteSpace(propertyName);
    PropertyName = propertyName;
  }
}

/// <summary>
/// When this field is sorted, the listed companion properties are appended with the same direction
/// before any implicit tie-breaker (for example date + time columns).
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSortWithAttribute : Attribute
{
  /// <summary>Companion property names on the same row type.</summary>
  public string[] PropertyNames { get; }

  /// <summary>Creates the attribute.</summary>
  /// <param name="propertyNames">One or more companion property names.</param>
  public GridSortWithAttribute(params string[] propertyNames)
  {
    ArgumentNullException.ThrowIfNull(propertyNames);
    if (propertyNames.Length == 0)
    {
      throw new ArgumentException("At least one companion property is required.", nameof(propertyNames));
    }

    if (propertyNames.Any(string.IsNullOrWhiteSpace))
    {
      throw new ArgumentException("Companion property names cannot be empty.", nameof(propertyNames));
    }

    PropertyNames = propertyNames;
  }
}
