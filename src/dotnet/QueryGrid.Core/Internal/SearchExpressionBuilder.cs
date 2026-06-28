using System.Linq.Expressions;
using System.Reflection;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds a case-insensitive OR-of-contains predicate across the row type's searchable fields.
/// </summary>
internal static class SearchExpressionBuilder
{
  private static readonly MethodInfo _toLower =
    typeof(string).GetMethod(nameof(string.ToLower), Type.EmptyTypes)!;

  private static readonly MethodInfo _contains =
    typeof(string).GetMethod(nameof(string.Contains), [typeof(string)])!;

  public static Expression<Func<T, bool>>? Build<T>(string? search, GridSchema schema)
  {
    if (string.IsNullOrWhiteSpace(search) || schema.SearchableFields.Count == 0)
    {
      return null;
    }

    var parameter = Expression.Parameter(typeof(T), "x");
    var lowered = Expression.Constant(search.Trim().ToLowerInvariant());
    var nullString = Expression.Constant(null, typeof(string));

    Expression? combined = null;
    foreach (var field in schema.SearchableFields)
    {
      var member = Expression.Property(parameter, field.Property);
      var match = Expression.Call(Expression.Call(member, _toLower), _contains, lowered);
      var guarded = Expression.AndAlso(Expression.NotEqual(member, nullString), match);
      combined = combined is null ? guarded : Expression.OrElse(combined, guarded);
    }

    return Expression.Lambda<Func<T, bool>>(combined!, parameter);
  }
}
