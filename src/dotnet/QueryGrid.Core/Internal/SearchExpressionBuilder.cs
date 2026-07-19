using System.Linq.Expressions;
using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds a provider-agnostic OR predicate across the row type's searchable fields:
/// case-insensitive contains for text, equality for Guid values.
/// </summary>
internal static class SearchExpressionBuilder
{
  public static Expression<Func<T, bool>>? Build<T>(string? search, GridSchema schema)
  {
    if (string.IsNullOrWhiteSpace(search) || schema.SearchableFields.Count == 0)
    {
      return null;
    }

    var trimmed = search.Trim();
    var lowered = Expression.Constant(trimmed.ToLowerInvariant());
    var parameter = Expression.Parameter(typeof(T), "x");

    Expression? combined = null;
    foreach (var field in schema.SearchableFields)
    {
      var member = Expression.Property(parameter, field.Property);
      var match = field.Category switch
      {
        FieldCategory.Text => BuildStringContains(member, lowered),
        FieldCategory.Guid => BuildGuidEquality(member, trimmed),
        _ => throw new InvalidOperationException(
          $"Field '{field.Name}' is searchable but has unsupported category '{field.Category}'."),
      };

      if (match is null)
      {
        continue;
      }

      combined = combined is null ? match : Expression.OrElse(combined, match);
    }

    return combined is null
      ? null
      : Expression.Lambda<Func<T, bool>>(combined, parameter);
  }

  private static Expression BuildStringContains(Expression member, Expression loweredSearch)
  {
    return CaseInsensitiveStringExpressions.BuildMatch(
      member, loweredSearch, StringExpressionMethods.Contains, typeof(string));
  }

  private static Expression? BuildGuidEquality(Expression member, string search)
  {
    if (!Guid.TryParse(search, out var parsed))
    {
      return null;
    }

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

    var constant = Expression.Constant(parsed, underlying);
    var equal = Expression.Equal(guidValue, constant, liftToNull: false, method: null);
    return notNull is null ? equal : Expression.AndAlso(notNull, equal);
  }
}
