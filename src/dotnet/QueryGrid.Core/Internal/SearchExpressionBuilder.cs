using System.Linq.Expressions;
using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds a provider-agnostic OR predicate across the row type's searchable fields:
/// case-insensitive contains for text; full or partial Guid match for Guid fields.
/// </summary>
internal static class SearchExpressionBuilder
{
  private static readonly MethodInfo GuidToString =
    typeof(Guid).GetMethod(nameof(Guid.ToString), Type.EmptyTypes)!;

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
        FieldCategory.Guid => BuildGuidSearch(member, trimmed, lowered),
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

  private static Expression? BuildGuidSearch(Expression member, string search, Expression loweredSearch)
  {
    if (Guid.TryParse(search, out var parsed))
    {
      return BuildGuidEquality(member, parsed);
    }

    if (!LooksLikeGuidFragment(search))
    {
      return null;
    }

    return BuildGuidStringContains(member, loweredSearch);
  }

  private static bool LooksLikeGuidFragment(string search)
  {
    if (search.Length == 0)
    {
      return false;
    }

    foreach (var c in search)
    {
      if (c is '-' or '{' or '}')
      {
        continue;
      }

      if (!Uri.IsHexDigit(c))
      {
        return false;
      }
    }

    return true;
  }

  private static Expression BuildGuidStringContains(Expression member, Expression loweredSearch)
  {
    var (guidValue, notNull) = UnwrapGuidMember(member);
    var loweredGuid = Expression.Call(
      Expression.Call(guidValue, GuidToString),
      StringExpressionMethods.ToLower);
    var contains = Expression.Call(loweredGuid, StringExpressionMethods.Contains, loweredSearch);
    return notNull is null ? contains : Expression.AndAlso(notNull, contains);
  }

  private static Expression BuildGuidEquality(Expression member, Guid parsed)
  {
    var underlying = TypeClassifier.UnwrapNullable(member.Type);
    var (guidValue, notNull) = UnwrapGuidMember(member);

    var constant = Expression.Constant(parsed, underlying);
    var equal = Expression.Equal(guidValue, constant, liftToNull: false, method: null);
    return notNull is null ? equal : Expression.AndAlso(notNull, equal);
  }

  private static (Expression GuidValue, Expression? NotNull) UnwrapGuidMember(Expression member)
  {
    var underlying = TypeClassifier.UnwrapNullable(member.Type);
    if (underlying == member.Type)
    {
      return (member, null);
    }

    var notNull = Expression.Property(member, nameof(Nullable<Guid>.HasValue));
    var valueProperty = member.Type.GetProperty(
      nameof(Nullable<Guid>.Value),
      BindingFlags.Public | BindingFlags.Instance)!;
    return (Expression.Property(member, valueProperty), notNull);
  }
}
