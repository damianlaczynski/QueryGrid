using QueryGrid.Abstractions;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Classifies CLR types into <see cref="FieldCategory"/> values and derives the set of
/// operators that are valid for each category.
/// </summary>
internal static class TypeClassifier
{
  private static readonly FilterOperator[] _textOperators =
  [
    FilterOperator.Eq, FilterOperator.Ne, FilterOperator.Contains, FilterOperator.NotContains,
    FilterOperator.StartsWith, FilterOperator.EndsWith, FilterOperator.In, FilterOperator.NotIn
  ];

  private static readonly FilterOperator[] _comparableOperators =
  [
    FilterOperator.Eq, FilterOperator.Ne, FilterOperator.Lt, FilterOperator.Lte,
    FilterOperator.Gt, FilterOperator.Gte, FilterOperator.Between, FilterOperator.In, FilterOperator.NotIn
  ];

  private static readonly FilterOperator[] _equalityOperators =
  [
    FilterOperator.Eq, FilterOperator.Ne, FilterOperator.In, FilterOperator.NotIn
  ];

  private static readonly FilterOperator[] _booleanOperators =
  [
    FilterOperator.Eq, FilterOperator.Ne
  ];

  /// <summary>Returns the non-nullable underlying type for <see cref="Nullable{T}"/>, otherwise the type itself.</summary>
  public static Type UnwrapNullable(Type type) => Nullable.GetUnderlyingType(type) ?? type;

  /// <summary>Determines whether a value of <paramref name="type"/> can be <see langword="null"/>.</summary>
  public static bool IsNullable(Type type)
    => !type.IsValueType || Nullable.GetUnderlyingType(type) is not null;

  /// <summary>Attempts to classify a CLR type into a <see cref="FieldCategory"/>.</summary>
  public static bool TryGetCategory(Type type, out FieldCategory category)
  {
    var t = UnwrapNullable(type);

    if (t.IsEnum)
    {
      category = FieldCategory.Enum;
      return true;
    }

    if (t == typeof(string))
    {
      category = FieldCategory.Text;
      return true;
    }

    if (t == typeof(bool))
    {
      category = FieldCategory.Boolean;
      return true;
    }

    if (t == typeof(Guid))
    {
      category = FieldCategory.Guid;
      return true;
    }

    if (t == typeof(DateTime) || t == typeof(DateTimeOffset) || t == typeof(DateOnly)
      || t == typeof(TimeOnly) || t == typeof(TimeSpan))
    {
      category = FieldCategory.DateTime;
      return true;
    }

    if (t == typeof(byte) || t == typeof(sbyte) || t == typeof(short) || t == typeof(ushort)
      || t == typeof(int) || t == typeof(uint) || t == typeof(long) || t == typeof(ulong)
      || t == typeof(float) || t == typeof(double) || t == typeof(decimal))
    {
      category = FieldCategory.Number;
      return true;
    }

    category = default;
    return false;
  }

  /// <summary>Returns the operators allowed for a field of the given category and nullability.</summary>
  public static IReadOnlySet<FilterOperator> GetAllowedOperators(FieldCategory category, bool nullable)
  {
    var baseOperators = category switch
    {
      FieldCategory.Text => _textOperators,
      FieldCategory.Number or FieldCategory.DateTime => _comparableOperators,
      FieldCategory.Boolean => _booleanOperators,
      FieldCategory.Enum or FieldCategory.Guid => _equalityOperators,
      _ => []
    };

    var set = new HashSet<FilterOperator>(baseOperators);
    if (nullable)
    {
      set.Add(FilterOperator.IsNull);
      set.Add(FilterOperator.IsNotNull);
    }

    return set;
  }
}
