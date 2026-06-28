using System.Collections.Concurrent;
using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Internal;

namespace QueryGrid.Core.Schema;

/// <summary>
/// Builds and caches <see cref="GridSchema"/> instances by reflecting over a row type's
/// public scalar properties. Discovery is convention-based: every readable scalar property
/// is sortable and filterable by default, overridable with attributes.
/// </summary>
public static class GridSchemaProvider
{
  private static readonly ConcurrentDictionary<Type, GridSchema> _cache = new();

  /// <summary>Returns the cached schema for <typeparamref name="T"/>, building it on first use.</summary>
  public static GridSchema GetSchema<T>() => GetSchema(typeof(T));

  /// <summary>Returns the cached schema for <paramref name="rowType"/>, building it on first use.</summary>
  public static GridSchema GetSchema(Type rowType)
    => _cache.GetOrAdd(rowType, Build);

  private static GridSchema Build(Type rowType)
  {
    var fields = new List<GridFieldInfo>();

    foreach (var property in rowType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
    {
      if (property.GetIndexParameters().Length > 0 || property.GetMethod is null)
      {
        continue;
      }

      if (property.GetCustomAttribute<GridIgnoreAttribute>() is not null)
      {
        continue;
      }

      if (!TypeClassifier.TryGetCategory(property.PropertyType, out var category))
      {
        continue;
      }

      var nullable = TypeClassifier.IsNullable(property.PropertyType);
      var sortEnabled = property.GetCustomAttribute<GridSortAttribute>()?.Enabled ?? true;
      var filterEnabled = property.GetCustomAttribute<GridFilterAttribute>()?.Enabled ?? true;
      var searchable = category == FieldCategory.Text
        && property.GetCustomAttribute<GridSearchableAttribute>() is not null;

      fields.Add(new GridFieldInfo
      {
        Name = property.Name,
        Property = property,
        ClrType = property.PropertyType,
        Category = category,
        CanSort = sortEnabled,
        CanFilter = filterEnabled,
        IsSearchable = searchable,
        AllowedOperators = TypeClassifier.GetAllowedOperators(category, nullable)
      });
    }

    return new GridSchema(rowType, fields);
  }
}
