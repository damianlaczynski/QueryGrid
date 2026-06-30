/** Stable codes for {@link GridValidationException} (.NET). Keep in sync with `GridValidationCodes.cs`. */
export const GRID_VALIDATION_CODES = {
  unknownField: "unknown_field",
  fieldNotFilterable: "field_not_filterable",
  fieldNotSortable: "field_not_sortable",
  operatorNotAllowed: "operator_not_allowed",
  operatorNotSupported: "operator_not_supported",
  invalidFilter: "invalid_filter",
  invalidValue: "invalid_value",
  filterTooDeep: "filter_too_deep",
  tooManyConditions: "too_many_conditions",
  inListTooLong: "in_list_too_long",
  tooManySorts: "too_many_sorts",
  pageTooLarge: "page_too_large",
} as const;

export type GridValidationCode =
  (typeof GRID_VALIDATION_CODES)[keyof typeof GRID_VALIDATION_CODES];

/** Transport / binding failures outside the query engine. Keep in sync with `GridTransportErrorCodes.cs`. */
export const GRID_TRANSPORT_ERROR_CODES = {
  invalidGridJson: "invalid_grid_json",
} as const;

export type GridTransportErrorCode =
  (typeof GRID_TRANSPORT_ERROR_CODES)[keyof typeof GRID_TRANSPORT_ERROR_CODES];

export const GRID_ERROR_CODES = {
  ...GRID_VALIDATION_CODES,
  ...GRID_TRANSPORT_ERROR_CODES,
} as const;

export type GridErrorCode =
  (typeof GRID_ERROR_CODES)[keyof typeof GRID_ERROR_CODES];

const gridValidationCodeSet = new Set<string>(
  Object.values(GRID_VALIDATION_CODES),
);

const gridErrorCodeSet = new Set<string>(Object.values(GRID_ERROR_CODES));

export function isGridValidationCode(code: string): code is GridValidationCode {
  return gridValidationCodeSet.has(code);
}

export function isGridErrorCode(code: string): code is GridErrorCode {
  return gridErrorCodeSet.has(code);
}
