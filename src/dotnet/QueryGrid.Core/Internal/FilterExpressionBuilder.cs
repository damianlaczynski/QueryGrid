using System.Collections;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Translates a <see cref="FilterNode"/> tree into a strongly-typed predicate expression,
/// enforcing the configured depth and condition limits along the way.
/// </summary>
internal static class FilterExpressionBuilder
{
  private static readonly MethodInfo _enumerableContains = typeof(Enumerable)
    .GetMethods(BindingFlags.Static | BindingFlags.Public)
    .Single(method =>
      method.Name == nameof(Enumerable.Contains) &&
      method.GetParameters().Length == 2);

  public static Expression<Func<T, bool>>? Build<T>(FilterNode? node, GridSchema schema, GridOptions options)
  {
    if (node is null)
    {
      return null;
    }

    var parameter = Expression.Parameter(typeof(T), "x");
    var conditions = 0;
    var body = BuildNode(node, parameter, schema, options, depth: 1, ref conditions);
    return Expression.Lambda<Func<T, bool>>(body, parameter);
  }

  private static Expression BuildNode(
    FilterNode node, ParameterExpression parameter, GridSchema schema, GridOptions options, int depth, ref int conditions)
  {
    switch (node)
    {
      case FilterGroup group:
        if (depth > options.MaxFilterDepth)
        {
          throw new GridValidationException(
            GridValidationCodes.FilterTooDeep, $"Filter nesting exceeds the maximum depth of {options.MaxFilterDepth}.");
        }

        if (group.Conditions.Count == 0)
        {
          return Expression.Constant(true);
        }

        Expression? combined = null;
        foreach (var child in group.Conditions)
        {
          var childExpression = BuildNode(child, parameter, schema, options, depth + 1, ref conditions);
          combined = combined is null
            ? childExpression
            : group.Logic == FilterLogic.Or
              ? Expression.OrElse(combined, childExpression)
              : Expression.AndAlso(combined, childExpression);
        }

        return combined!;

      case FilterCondition condition:
        conditions++;
        if (conditions > options.MaxConditions)
        {
          throw new GridValidationException(
            GridValidationCodes.TooManyConditions, $"Filter exceeds the maximum of {options.MaxConditions} conditions.");
        }

        return BuildCondition(condition, parameter, schema, options);

      default:
        throw new GridValidationException(GridValidationCodes.InvalidFilter, "Unsupported filter node type.");
    }
  }

  private static Expression BuildCondition(
    FilterCondition condition, ParameterExpression parameter, GridSchema schema, GridOptions options)
  {
    var field = schema.Require(condition.Field);

    if (!field.CanFilter)
    {
      throw new GridValidationException(
        GridValidationCodes.FieldNotFilterable, $"Field '{field.Name}' cannot be filtered.");
    }

    if (!field.AllowedOperators.Contains(condition.Operator))
    {
      throw new GridValidationException(
        GridValidationCodes.OperatorNotAllowed,
        $"Operator '{condition.Operator}' is not valid for field '{field.Name}'.");
    }

    var member = Expression.Property(parameter, field.Property);

    switch (condition.Operator)
    {
      case FilterOperator.IsNull:
        return Expression.Equal(member, Expression.Constant(null, field.ClrType));

      case FilterOperator.IsNotNull:
        return Expression.NotEqual(member, Expression.Constant(null, field.ClrType));

      case FilterOperator.Eq:
      case FilterOperator.Ne:
        {
          var value = GridValueConverter.Convert(condition.Value, field.ClrType, field.Name);
          if (value is null)
          {
            if (!TypeClassifier.IsNullable(field.ClrType))
            {
              throw new GridValidationException(
                GridValidationCodes.InvalidValue,
                $"Operator '{condition.Operator}' on '{field.Name}' cannot be used with null.");
            }

            var nullConstant = Expression.Constant(null, field.ClrType);
            return condition.Operator == FilterOperator.Eq
              ? Expression.Equal(member, nullConstant)
              : Expression.NotEqual(member, nullConstant);
          }

          var constant = Expression.Constant(value, field.ClrType);
          return condition.Operator == FilterOperator.Eq
            ? Expression.Equal(member, constant, liftToNull: false, method: null)
            : Expression.NotEqual(member, constant, liftToNull: false, method: null);
        }

      case FilterOperator.Lt:
      case FilterOperator.Lte:
      case FilterOperator.Gt:
      case FilterOperator.Gte:
        {
          var value = GridValueConverter.Convert(condition.Value, field.ClrType, field.Name)
            ?? throw new GridValidationException(
              GridValidationCodes.InvalidValue, $"Operator '{condition.Operator}' on '{field.Name}' requires a value.");
          var constant = Expression.Constant(value, field.ClrType);
          return BuildComparison(condition.Operator, member, constant);
        }

      case FilterOperator.Contains:
        return BuildStringMatch(member, condition, field, StringExpressionMethods.Contains);

      case FilterOperator.NotContains:
        return Expression.Not(BuildStringMatch(member, condition, field, StringExpressionMethods.Contains));

      case FilterOperator.StartsWith:
        return BuildStringMatch(member, condition, field, StringExpressionMethods.StartsWith);

      case FilterOperator.EndsWith:
        return BuildStringMatch(member, condition, field, StringExpressionMethods.EndsWith);

      case FilterOperator.In:
      case FilterOperator.NotIn:
        return BuildInList(member, condition, field, options);

      case FilterOperator.Between:
        return BuildBetween(member, condition, field);

      default:
        throw new GridValidationException(
          GridValidationCodes.OperatorNotSupported, $"Operator '{condition.Operator}' is not supported.");
    }
  }

  private static Expression BuildComparison(FilterOperator op, Expression member, Expression constant)
  {
    return op switch
    {
      FilterOperator.Lt => Expression.LessThan(member, constant, liftToNull: false, method: null),
      FilterOperator.Lte => Expression.LessThanOrEqual(member, constant, liftToNull: false, method: null),
      FilterOperator.Gt => Expression.GreaterThan(member, constant, liftToNull: false, method: null),
      FilterOperator.Gte => Expression.GreaterThanOrEqual(member, constant, liftToNull: false, method: null),
      _ => throw new GridValidationException(GridValidationCodes.OperatorNotSupported, $"Operator '{op}' is not a comparison.")
    };
  }

  private static Expression BuildStringMatch(
    MemberExpression member, FilterCondition condition, GridFieldInfo field, MethodInfo method)
  {
    var value = GridValueConverter.Convert(condition.Value, typeof(string), field.Name) as string
      ?? throw new GridValidationException(
        GridValidationCodes.InvalidValue, $"Operator '{condition.Operator}' on '{field.Name}' requires a string value.");

    var loweredValue = Expression.Constant(value.ToLowerInvariant());
    return CaseInsensitiveStringExpressions.BuildMatch(
      member, loweredValue, method, typeof(string));
  }

  private static Expression BuildInList(
    MemberExpression member, FilterCondition condition, GridFieldInfo field, GridOptions options)
  {
    var rawValues = EnumerateValues(condition.Value).ToList();
    if (rawValues.Count > options.MaxInListLength)
    {
      throw new GridValidationException(
        GridValidationCodes.InListTooLong,
        $"'{condition.Operator}' list for '{field.Name}' exceeds the maximum of {options.MaxInListLength} items.");
    }

    var constants = rawValues
      .Select(raw => Expression.Constant(
        GridValueConverter.Convert(raw, field.ClrType, field.Name),
        field.ClrType))
      .ToArray();

    var arrayExpression = Expression.NewArrayInit(field.ClrType, constants);
    var containsMethod = _enumerableContains.MakeGenericMethod(field.ClrType);
    var containsCall = Expression.Call(containsMethod, arrayExpression, member);
    return condition.Operator == FilterOperator.NotIn ? Expression.Not(containsCall) : containsCall;
  }

  private static Expression BuildBetween(MemberExpression member, FilterCondition condition, GridFieldInfo field)
  {
    var bounds = EnumerateValues(condition.Value).ToList();
    if (bounds.Count != 2)
    {
      throw new GridValidationException(
        GridValidationCodes.InvalidValue, $"Operator 'Between' on '{field.Name}' requires exactly two values.");
    }

    var lower = Expression.Constant(GridValueConverter.Convert(bounds[0], field.ClrType, field.Name), field.ClrType);
    var upper = Expression.Constant(GridValueConverter.Convert(bounds[1], field.ClrType, field.Name), field.ClrType);
    var lowerBound = Expression.GreaterThanOrEqual(member, lower, liftToNull: false, method: null);
    var upperBound = Expression.LessThanOrEqual(member, upper, liftToNull: false, method: null);
    return Expression.AndAlso(lowerBound, upperBound);
  }

  private static IEnumerable<object?> EnumerateValues(object? raw)
  {
    switch (raw)
    {
      case null:
        yield break;

      case JsonElement { ValueKind: JsonValueKind.Array } json:
        foreach (var element in json.EnumerateArray())
        {
          yield return element;
        }

        break;

      case string single:
        yield return single;
        break;

      case IEnumerable enumerable:
        foreach (var item in enumerable)
        {
          yield return item;
        }

        break;

      default:
        yield return raw;
        break;
    }
  }
}
