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
/// Marks a string property as a target for free-text <see cref="GridQuery.Search"/>.
/// When no property is marked, search is disabled for the row type.
/// </summary>
[AttributeUsage(AttributeTargets.Property, AllowMultiple = false, Inherited = true)]
public sealed class GridSearchableAttribute : Attribute
{
}
