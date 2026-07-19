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
      var searchable = property.GetCustomAttribute<GridSearchableAttribute>() is not null
        && category is FieldCategory.Text or FieldCategory.Guid;
      var sortTieBreaker = property.GetCustomAttribute<GridSortTieBreakerAttribute>() is not null;
      var enumSortOrder = ResolveEnumSortOrder(property, category);
      var sortKeyProperty = ResolveSortKeyProperty(rowType, property);
      var sortCompanionNames = property.GetCustomAttribute<GridSortWithAttribute>()?.PropertyNames ?? [];

      fields.Add(new GridFieldInfo
      {
        Name = property.Name,
        Property = property,
        ClrType = property.PropertyType,
        Category = category,
        CanSort = sortEnabled,
        CanFilter = filterEnabled,
        IsSearchable = searchable,
        IsSortTieBreaker = sortTieBreaker,
        AllowedOperators = TypeClassifier.GetAllowedOperators(category, nullable),
        SortKeyProperty = sortKeyProperty,
        SortCompanionNames = sortCompanionNames,
        EnumSortOrder = enumSortOrder,
      });
    }

    ValidateFieldMetadata(rowType, fields);
    return new GridSchema(rowType, fields);
  }

  private static IReadOnlyList<object>? ResolveEnumSortOrder(PropertyInfo property, FieldCategory category)
  {
    var attribute = property.GetCustomAttribute<GridEnumOrderAttribute>();
    if (attribute is null)
    {
      return null;
    }

    if (category is not FieldCategory.Enum)
    {
      throw new InvalidOperationException(
        $"[GridEnumOrder] on '{property.DeclaringType?.Name}.{property.Name}' requires an enum property.");
    }

    var enumType = TypeClassifier.UnwrapNullable(property.PropertyType);
    var values = attribute.Values;
    var distinct = new HashSet<object>();
    foreach (var value in values)
    {
      if (value.GetType() != enumType)
      {
        throw new InvalidOperationException(
          $"[GridEnumOrder] value '{value}' on '{property.DeclaringType?.Name}.{property.Name}' is not of type '{enumType.Name}'.");
      }

      if (!distinct.Add(value))
      {
        throw new InvalidOperationException(
          $"[GridEnumOrder] on '{property.DeclaringType?.Name}.{property.Name}' contains duplicate value '{value}'.");
      }
    }

    return values;
  }

  private static PropertyInfo? ResolveSortKeyProperty(Type rowType, PropertyInfo property)
  {
    var attribute = property.GetCustomAttribute<GridSortKeyAttribute>();
    if (attribute is null)
    {
      return null;
    }

    var sortKey = rowType.GetProperty(
      attribute.PropertyName,
      BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

    if (sortKey is null)
    {
      throw new InvalidOperationException(
        $"[GridSortKey] on '{rowType.Name}.{property.Name}' references unknown property '{attribute.PropertyName}'.");
    }

    if (sortKey.GetIndexParameters().Length > 0 || sortKey.GetMethod is null)
    {
      throw new InvalidOperationException(
        $"[GridSortKey] on '{rowType.Name}.{property.Name}' references property '{attribute.PropertyName}' that is not readable.");
    }

    return sortKey;
  }

  private static void ValidateFieldMetadata(Type rowType, List<GridFieldInfo> fields)
  {
    var byName = fields.ToDictionary(f => f.Name, StringComparer.OrdinalIgnoreCase);

    foreach (var field in fields)
    {
      foreach (var companionName in field.SortCompanionNames)
      {
        if (!byName.TryGetValue(companionName, out var companion))
        {
          throw new InvalidOperationException(
            $"[GridSortWith] on '{rowType.Name}.{field.Name}' references unknown field '{companionName}'.");
        }

        if (!companion.CanSort)
        {
          throw new InvalidOperationException(
            $"[GridSortWith] on '{rowType.Name}.{field.Name}' references non-sortable field '{companionName}'.");
        }
      }
    }
  }
}
