using System.Linq.Expressions;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Applies an ordered list of <see cref="SortDescriptor"/>s to a query as a stable multi-sort.
/// </summary>
internal static class SortExpressionBuilder
{
  public static IQueryable<T> Apply<T>(
    IQueryable<T> source, IList<SortDescriptor> sorts, GridSchema schema, GridOptions options)
  {
    if (sorts.Count == 0)
    {
      return source;
    }

    if (sorts.Count > options.MaxSortDescriptors)
    {
      throw new GridValidationException(
        "too_many_sorts", $"Sort exceeds the maximum of {options.MaxSortDescriptors} descriptors.");
    }

    IQueryable<T> result = source;
    var appliedSortFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    for (var i = 0; i < sorts.Count; i++)
    {
      var descriptor = sorts[i];
      var field = schema.Require(descriptor.Field);
      if (!field.CanSort)
      {
        throw new GridValidationException(
          "field_not_sortable", $"Field '{field.Name}' cannot be sorted.");
      }

      appliedSortFields.Add(field.Name);
      result = ApplyOne(result, field, descriptor.Desc, first: i == 0);
    }

    var idField = schema.Find("Id");
    if (idField is { CanSort: true } && !appliedSortFields.Contains(idField.Name))
    {
      result = ApplyOne(result, idField, desc: false, first: false);
    }

    return result;
  }

  /// <summary>
  /// Returns the sort descriptors that <see cref="Apply"/> would use, including any implicit tie-breaker.
  /// </summary>
  public static IReadOnlyList<SortDescriptor> ResolveEffectiveSort(
    IList<SortDescriptor> sorts, GridSchema schema, GridOptions options)
  {
    if (sorts.Count == 0)
    {
      return [];
    }

    if (sorts.Count > options.MaxSortDescriptors)
    {
      throw new GridValidationException(
        "too_many_sorts", $"Sort exceeds the maximum of {options.MaxSortDescriptors} descriptors.");
    }

    var result = new List<SortDescriptor>(sorts.Count + 1);
    var appliedSortFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    foreach (var descriptor in sorts)
    {
      var field = schema.Require(descriptor.Field);
      if (!field.CanSort)
      {
        throw new GridValidationException(
          "field_not_sortable", $"Field '{field.Name}' cannot be sorted.");
      }

      appliedSortFields.Add(field.Name);
      result.Add(descriptor);
    }

    var idField = schema.Find("Id");
    if (idField is { CanSort: true } && !appliedSortFields.Contains(idField.Name))
    {
      result.Add(new SortDescriptor(idField.Name, desc: false));
    }

    return result;
  }

  private static IOrderedQueryable<T> ApplyOne<T>(IQueryable<T> source, GridFieldInfo field, bool desc, bool first)
  {
    var parameter = Expression.Parameter(typeof(T), "x");
    var member = Expression.Property(parameter, field.Property);
    var keySelector = Expression.Lambda(member, parameter);

    var methodName = (first, desc) switch
    {
      (true, false) => nameof(Queryable.OrderBy),
      (true, true) => nameof(Queryable.OrderByDescending),
      (false, false) => nameof(Queryable.ThenBy),
      (false, true) => nameof(Queryable.ThenByDescending)
    };

    var call = Expression.Call(
      typeof(Queryable),
      methodName,
      [typeof(T), field.Property.PropertyType],
      source.Expression,
      Expression.Quote(keySelector));

    return (IOrderedQueryable<T>)source.Provider.CreateQuery<T>(call);
  }
}
