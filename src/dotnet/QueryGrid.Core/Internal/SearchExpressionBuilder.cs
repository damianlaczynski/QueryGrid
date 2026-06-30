using System.Linq.Expressions;
using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds a case-insensitive OR-of-contains predicate across the row type's searchable fields.
/// </summary>
internal static class SearchExpressionBuilder
{
  private static readonly MethodInfo _guidToString =
    typeof(Guid).GetMethod(nameof(Guid.ToString), Type.EmptyTypes)!;

  public static Expression<Func<T, bool>>? Build<T>(string? search, GridSchema schema)
  {
    if (string.IsNullOrWhiteSpace(search) || schema.SearchableFields.Count == 0)
    {
      return null;
    }

    var parameter = Expression.Parameter(typeof(T), "x");
    var lowered = Expression.Constant(search.Trim().ToLowerInvariant());

    Expression? combined = null;
    foreach (var field in schema.SearchableFields)
    {
      var member = Expression.Property(parameter, field.Property);
      var match = field.Category switch
      {
        FieldCategory.Text => BuildStringContains(member, lowered),
        FieldCategory.Guid => BuildGuidContains(member, lowered),
        _ => throw new InvalidOperationException(
          $"Field '{field.Name}' is searchable but has unsupported category '{field.Category}'."),
      };

      combined = combined is null ? match : Expression.OrElse(combined, match);
    }

    return Expression.Lambda<Func<T, bool>>(combined!, parameter);
  }

  private static Expression BuildStringContains(Expression member, Expression loweredSearch)
  {
    return CaseInsensitiveStringExpressions.BuildMatch(
      member, loweredSearch, StringExpressionMethods.Contains, typeof(string));
  }

  private static Expression BuildGuidContains(Expression member, Expression loweredSearch)
  {
    var underlying = TypeClassifier.UnwrapNullable(member.Type);
    Expression guidValue = member;
    Expression? notNull = null;

    if (underlying != member.Type)
    {
      notNull = Expression.Property(member, nameof(Nullable<Guid>.HasValue));
      var valueProperty = member.Type.GetProperty(
        nameof(Nullable<Guid>.Value),
        BindingFlags.Public | BindingFlags.Instance)!;
      guidValue = Expression.Property(member, valueProperty);
    }

    var text = Expression.Call(guidValue, _guidToString);
    var loweredText = Expression.Call(text, StringExpressionMethods.ToLowerInvariant);
    var match = Expression.Call(loweredText, StringExpressionMethods.Contains, loweredSearch);
    return notNull is null ? match : Expression.AndAlso(notNull, match);
  }
}
