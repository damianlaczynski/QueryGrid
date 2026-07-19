using System.Linq.Expressions;
using QueryGrid.Abstractions;
using QueryGrid.Core.Internal;

namespace QueryGrid.Core;

/// <summary>Helpers for working with <see cref="GridQuery"/> instances.</summary>
public static class GridQueryExtensions
{
  /// <summary>Returns a copy of the query with <see cref="GridQuery.Search"/> cleared.</summary>
  public static GridQuery WithoutSearch(this GridQuery query)
  {
    ArgumentNullException.ThrowIfNull(query);

    return new GridQuery
    {
      Skip = query.Skip,
      Take = query.Take,
      Sort = query.Sort,
      Filter = query.Filter,
    };
  }
}

/// <summary>Entity-level search helpers for complex projections.</summary>
public static class GridEntitySearchExtensions
{
  /// <summary>
  /// Applies free-text search across the given entity string fields before projecting to a DTO.
  /// Pair with <see cref="GridQueryExtensions.WithoutSearch"/> when calling <c>ToGridResultAsync</c>
  /// on the projected query.
  /// </summary>
  public static IQueryable<TEntity> ApplyEntitySearch<TEntity>(
    this IQueryable<TEntity> source,
    string? search,
    params Expression<Func<TEntity, string?>>[] fields)
    => ApplyEntitySearch(source, search, options: null, fields);

  /// <inheritdoc cref="ApplyEntitySearch{TEntity}(IQueryable{TEntity}, string?, Expression{Func{TEntity, string?}}[])"/>
  public static IQueryable<TEntity> ApplyEntitySearch<TEntity>(
    this IQueryable<TEntity> source,
    string? search,
    GridOptions? options,
    params Expression<Func<TEntity, string?>>[] fields)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(fields);

    if (string.IsNullOrWhiteSpace(search) || fields.Length == 0)
    {
      return source;
    }

    options ??= GridOptions.Default;
    var matchBuilder = options.ResolveSearchMatchBuilder();
    var trimmed = search.Trim();
    var parameter = fields[0].Parameters[0];

    Expression? combined = null;
    foreach (var field in fields)
    {
      var member = new ParameterReplacer(field.Parameters[0], parameter).Visit(field.Body);
      var match = matchBuilder.BuildTextMatch(member, trimmed, typeof(string));
      if (match is null)
      {
        continue;
      }

      combined = combined is null ? match : Expression.OrElse(combined, match);
    }

    if (combined is null)
    {
      return source;
    }

    var predicate = Expression.Lambda<Func<TEntity, bool>>(combined, parameter);
    return source.Where(predicate);
  }

  private sealed class ParameterReplacer(ParameterExpression source, ParameterExpression target) : ExpressionVisitor
  {
    protected override Expression VisitParameter(ParameterExpression node)
      => node == source ? target : base.VisitParameter(node);
  }
}
