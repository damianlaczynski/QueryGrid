namespace QueryGrid.Abstractions;

/// <summary>
/// Stable machine-readable codes for <see cref="GridValidationException"/>.
/// Keep in sync with <c>@query-grid/core</c> <c>GRID_VALIDATION_CODES</c> (TypeScript).
/// </summary>
public static class GridValidationCodes
{
  /// <summary>The filter or sort references a field that does not exist on the row type.</summary>
  public const string UnknownField = "unknown_field";

  /// <summary>The field exists but is not allowed to be filtered.</summary>
  public const string FieldNotFilterable = "field_not_filterable";

  /// <summary>The field exists but is not allowed to be sorted.</summary>
  public const string FieldNotSortable = "field_not_sortable";

  /// <summary>The operator is not valid for the field's type.</summary>
  public const string OperatorNotAllowed = "operator_not_allowed";

  /// <summary>The operator is not supported by the query engine.</summary>
  public const string OperatorNotSupported = "operator_not_supported";

  /// <summary>The filter tree structure is invalid.</summary>
  public const string InvalidFilter = "invalid_filter";

  /// <summary>A filter value is missing, malformed, or incompatible with the field.</summary>
  public const string InvalidValue = "invalid_value";

  /// <summary>The filter tree exceeds the maximum nesting depth.</summary>
  public const string FilterTooDeep = "filter_too_deep";

  /// <summary>The filter tree exceeds the maximum number of conditions.</summary>
  public const string TooManyConditions = "too_many_conditions";

  /// <summary>An <c>in</c> or <c>notIn</c> list exceeds the maximum allowed length.</summary>
  public const string InListTooLong = "in_list_too_long";

  /// <summary>The request exceeds the maximum number of sort descriptors.</summary>
  public const string TooManySorts = "too_many_sorts";

  /// <summary>The requested page size exceeds the configured maximum.</summary>
  public const string PageTooLarge = "page_too_large";

  /// <summary>The export request did not specify any columns.</summary>
  public const string ExportColumnsRequired = "export_columns_required";

  /// <summary>Export scope is selected keys but no keys were provided.</summary>
  public const string ExportSelectionRequired = "export_selection_required";

  /// <summary>The number of selected keys exceeds the configured export limit.</summary>
  public const string ExportSelectionTooLarge = "export_selection_too_large";

  /// <summary>The requested export format is not supported.</summary>
  public const string ExportFormatNotSupported = "export_format_not_supported";
}

/// <summary>
/// Stable codes for grid transport / binding failures outside the query engine.
/// Keep in sync with <c>@query-grid/core</c> <c>GRID_TRANSPORT_ERROR_CODES</c> (TypeScript).
/// </summary>
public static class GridTransportErrorCodes
{
  /// <summary>The grid query parameter could not be parsed as valid JSON.</summary>
  public const string InvalidGridJson = "invalid_grid_json";
}
