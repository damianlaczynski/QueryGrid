using System.Linq.Expressions;
using System.Reflection;

namespace QueryGrid.Core.Internal;

internal sealed class DefaultSearchMatchBuilder : ISearchMatchBuilder
{
  public static DefaultSearchMatchBuilder Instance { get; } = new();

  public Expression? BuildTextMatch(Expression member, string search, Type memberType)
  {
    var lowered = Expression.Constant(search.Trim().ToLowerInvariant());
    return CaseInsensitiveStringExpressions.BuildMatch(
      member, lowered, StringExpressionMethods.Contains, memberType);
  }

  public Expression? BuildGuidMatch(Expression member, string search)
  {
    if (!Guid.TryParse(search.Trim(), out var parsed))
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
