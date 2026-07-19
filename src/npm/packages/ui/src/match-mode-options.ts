import type { FilterOperator } from "@query-grid/core";
import type { GridColumnFilterType } from "./table/grid-column";

export interface MatchModeOption {
  label: string;
  value: FilterOperator;
}

const STRING_OPERATORS: FilterOperator[] = ["contains", "notContains", "startsWith", "endsWith"];

export function fixOperatorForColumnType(
  operator: FilterOperator,
  columnType?: GridColumnFilterType,
  nullable?: boolean,
): FilterOperator {
  if (nullable && (operator === "isNull" || operator === "isNotNull")) {
    return operator;
  }

  switch (columnType) {
    case "boolean":
      return operator === "ne" ? "ne" : "eq";
    case "guid":
      if (operator === "eq" || operator === "ne" || operator === "in" || operator === "notIn") {
        return operator;
      }
      return "eq";
    case "enum":
      if (operator === "in" || operator === "notIn" || operator === "eq" || operator === "ne") {
        return operator;
      }
      return "in";
    case "number":
    case "date":
      if (STRING_OPERATORS.includes(operator)) {
        return "eq";
      }
      return operator;
    case "text":
      return operator;
    default:
      return operator;
  }
}

export function buildEnumMatchModeOptions(): MatchModeOption[] {
  return [
    { label: "In", value: "in" },
    { label: "Not in", value: "notIn" },
  ];
}

export function buildMatchModeOptions(
  columnType: GridColumnFilterType | undefined,
  nullable?: boolean,
): MatchModeOption[] | undefined {
  switch (columnType) {
    case "text":
      return [
        { label: "Starts with", value: "startsWith" },
        { label: "Contains", value: "contains" },
        { label: "Not contains", value: "notContains" },
        { label: "Ends with", value: "endsWith" },
        { label: "Equals", value: "eq" },
        { label: "Not equals", value: "ne" },
        ...(nullable
          ? [
              { label: "Is empty", value: "isNull" as FilterOperator },
              { label: "Is not empty", value: "isNotNull" as FilterOperator },
            ]
          : []),
      ];
    case "number":
      return [
        { label: "Equals", value: "eq" },
        { label: "Not equals", value: "ne" },
        { label: "Less than", value: "lt" },
        { label: "Less or equal", value: "lte" },
        { label: "Greater than", value: "gt" },
        { label: "Greater or equal", value: "gte" },
        { label: "Between", value: "between" },
        ...(nullable
          ? [
              { label: "Is empty", value: "isNull" as FilterOperator },
              { label: "Is not empty", value: "isNotNull" as FilterOperator },
            ]
          : []),
      ];
    case "date":
      return [
        { label: "Is", value: "eq" },
        { label: "Is not", value: "ne" },
        { label: "Before", value: "lt" },
        { label: "After", value: "gt" },
        ...(nullable
          ? [
              { label: "Is empty", value: "isNull" as FilterOperator },
              { label: "Is not empty", value: "isNotNull" as FilterOperator },
            ]
          : []),
      ];
    case "guid":
      return [{ label: "Equals", value: "eq" }];
    default:
      return undefined;
  }
}
