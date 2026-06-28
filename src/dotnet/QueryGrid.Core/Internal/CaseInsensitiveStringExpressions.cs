using System.Linq.Expressions;
using System.Reflection;

namespace QueryGrid.Core.Internal;

internal static class CaseInsensitiveStringExpressions
{
  public static Expression BuildMatch(
    Expression member,
    Expression loweredValue,
    MethodInfo stringMethod,
    Type memberType)
  {
    var loweredMember = Expression.Call(member, StringExpressionMethods.ToLowerInvariant);
    var match = Expression.Call(loweredMember, stringMethod, loweredValue);
    var notNull = Expression.NotEqual(member, Expression.Constant(null, memberType));
    return Expression.AndAlso(notNull, match);
  }
}
