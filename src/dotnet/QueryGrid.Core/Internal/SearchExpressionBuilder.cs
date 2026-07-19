using System.Linq.Expressions;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds a case-insensitive OR-of-contains predicate across the row type's searchable fields.
/// </summary>
internal static class SearchExpressionBuilder
{
  public static Expression<Func<T, bool>>? Build<T>(
    string? search,
    GridSchema schema,
    ISearchMatchBuilder? matchBuilder = null)
  {
    if (string.IsNullOrWhiteSpace(search) || schema.SearchableFields.Count == 0)
    {
      return null;
    }

    matchBuilder ??= DefaultSearchMatchBuilder.Instance;
    var trimmed = search.Trim();
    var parameter = Expression.Parameter(typeof(T), "x");

    Expression? combined = null;
    foreach (var field in schema.SearchableFields)
    {
      var member = Expression.Property(parameter, field.Property);
      var match = field.Category switch
      {
        FieldCategory.Text => matchBuilder.BuildTextMatch(member, trimmed, field.ClrType),
        FieldCategory.Guid => matchBuilder.BuildGuidMatch(member, trimmed),
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
}
