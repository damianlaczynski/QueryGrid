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
    return ApplyEffective(source, ResolveEffectiveSort(sorts, schema, options), schema);
  }

  public static IQueryable<T> ApplyEffective<T>(
    IQueryable<T> source, IReadOnlyList<SortDescriptor> effectiveSorts, GridSchema schema)
  {
    if (effectiveSorts.Count == 0)
    {
      return source;
    }

    IQueryable<T> result = source;
    for (var i = 0; i < effectiveSorts.Count; i++)
    {
      var descriptor = effectiveSorts[i];
      var field = schema.Require(descriptor.Field);
      result = ApplyOne(result, field, descriptor.Desc, first: i == 0);
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
        GridValidationCodes.TooManySorts, $"Sort exceeds the maximum of {options.MaxSortDescriptors} descriptors.");
    }

    var result = new List<SortDescriptor>(sorts.Count + 1);
    var appliedSortFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    foreach (var descriptor in sorts)
    {
      var field = schema.Require(descriptor.Field);
      if (!field.CanSort)
      {
        throw new GridValidationException(
          GridValidationCodes.FieldNotSortable, $"Field '{field.Name}' cannot be sorted.");
      }

      appliedSortFields.Add(field.Name);
      result.Add(descriptor);
    }

    AppendSortTieBreaker(result, schema, appliedSortFields);
    return result;
  }

  private static void AppendSortTieBreaker(
    List<SortDescriptor> sorts, GridSchema schema, HashSet<string> appliedSortFields)
  {
    var tieBreaker = schema.SortTieBreakerField;
    if (tieBreaker is not null && !appliedSortFields.Contains(tieBreaker.Name))
    {
      sorts.Add(new SortDescriptor(tieBreaker.Name, desc: false));
    }
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
