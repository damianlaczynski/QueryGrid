using System.Linq.Expressions;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Builds rank expressions for enum properties with a custom business sort order.
/// </summary>
internal static class EnumSortExpressions
{
  public static Expression BuildRank(Expression enumMember, IReadOnlyList<object> orderedValues)
  {
    ArgumentNullException.ThrowIfNull(enumMember);
    ArgumentNullException.ThrowIfNull(orderedValues);

    var enumType = enumMember.Type;
    if (Nullable.GetUnderlyingType(enumType) is Type underlying)
    {
      enumMember = Expression.Property(enumMember, nameof(Nullable<int>.Value));
      enumType = underlying;
    }

    Expression body = Expression.Constant(orderedValues.Count);
    for (var i = orderedValues.Count - 1; i >= 0; i--)
    {
      var value = orderedValues[i];
      if (value.GetType() != enumType)
      {
        throw new InvalidOperationException(
          $"Enum sort value '{value}' is not of type '{enumType.Name}'.");
      }

      body = Expression.Condition(
        Expression.Equal(enumMember, Expression.Constant(value, enumType)),
        Expression.Constant(i),
        body);
    }

    return body;
  }
}
