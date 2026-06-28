namespace QueryGrid.Abstractions;

/// <summary>
/// Comparison operators supported by a <see cref="FilterCondition"/>.
/// The set of operators valid for a given field is inferred from that field's CLR type.
/// </summary>
public enum FilterOperator
{
  /// <summary>Equals (<c>==</c>).</summary>
  Eq,

  /// <summary>Not equals (<c>!=</c>).</summary>
  Ne,

  /// <summary>Less than (<c>&lt;</c>).</summary>
  Lt,

  /// <summary>Less than or equal (<c>&lt;=</c>).</summary>
  Lte,

  /// <summary>Greater than (<c>&gt;</c>).</summary>
  Gt,

  /// <summary>Greater than or equal (<c>&gt;=</c>).</summary>
  Gte,

  /// <summary>Value is contained in the provided list.</summary>
  In,

  /// <summary>Value is not contained in the provided list.</summary>
  NotIn,

  /// <summary>String contains the provided substring (case-insensitive).</summary>
  Contains,

  /// <summary>String does not contain the provided substring (case-insensitive).</summary>
  NotContains,

  /// <summary>String starts with the provided substring (case-insensitive).</summary>
  StartsWith,

  /// <summary>String ends with the provided substring (case-insensitive).</summary>
  EndsWith,

  /// <summary>Value is <see langword="null"/>.</summary>
  IsNull,

  /// <summary>Value is not <see langword="null"/>.</summary>
  IsNotNull,

  /// <summary>Value falls within an inclusive range expressed as a two-element list.</summary>
  Between
}
