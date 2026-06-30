namespace QueryGrid.Abstractions;

/// <summary>
/// Stable machine-readable codes for <see cref="GridValidationException"/>.
/// Keep in sync with <c>@query-grid/core</c> <c>GRID_VALIDATION_CODES</c> (TypeScript).
/// </summary>
public static class GridValidationCodes
{
  public const string UnknownField = "unknown_field";
  public const string FieldNotFilterable = "field_not_filterable";
  public const string FieldNotSortable = "field_not_sortable";
  public const string OperatorNotAllowed = "operator_not_allowed";
  public const string OperatorNotSupported = "operator_not_supported";
  public const string InvalidFilter = "invalid_filter";
  public const string InvalidValue = "invalid_value";
  public const string FilterTooDeep = "filter_too_deep";
  public const string TooManyConditions = "too_many_conditions";
  public const string InListTooLong = "in_list_too_long";
  public const string TooManySorts = "too_many_sorts";
  public const string PageTooLarge = "page_too_large";
}

/// <summary>
/// Stable codes for grid transport / binding failures outside the query engine.
/// Keep in sync with <c>@query-grid/core</c> <c>GRID_TRANSPORT_ERROR_CODES</c> (TypeScript).
/// </summary>
public static class GridTransportErrorCodes
{
  public const string InvalidGridJson = "invalid_grid_json";
}
