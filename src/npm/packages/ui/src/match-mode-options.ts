import type { FilterOperator } from "@query-grid/core";
import { getAllowedOperatorsForColumnType } from "@query-grid/core";
import type { GridColumnFilterType } from "./table/grid-column";

export interface MatchModeOption {
  label: string;
  value: FilterOperator;
}

export function buildEnumMatchModeOptions(nullable = false): MatchModeOption[] {
  const modes: MatchModeOption[] = [
    { label: "In", value: "in" },
    { label: "Not in", value: "notIn" },
  ];

  if (nullable) {
    modes.push(
      { label: "Equals", value: "eq" },
      { label: "Not equals", value: "ne" },
      { label: "Is empty", value: "isNull" },
      { label: "Is not empty", value: "isNotNull" },
    );
  }

  return modes;
}

function operatorLabel(operator: FilterOperator): string {
  switch (operator) {
    case "contains":
      return "Contains";
    case "notContains":
      return "Not contains";
    case "startsWith":
      return "Starts with";
    case "endsWith":
      return "Ends with";
    case "eq":
      return "Equals";
    case "ne":
      return "Not equals";
    case "lt":
      return "Less than";
    case "lte":
      return "Less or equal";
    case "gt":
      return "Greater than";
    case "gte":
      return "Greater or equal";
    case "between":
      return "Between";
    case "isNull":
      return "Is empty";
    case "isNotNull":
      return "Is not empty";
    default:
      return operator;
  }
}

export function buildMatchModeOptions(
  columnType: GridColumnFilterType | undefined,
  nullable?: boolean,
): MatchModeOption[] | undefined {
  if (columnType === "enum") {
    return buildEnumMatchModeOptions(nullable);
  }

  if (columnType === "guid") {
    return [{ label: "Equals", value: "eq" }];
  }

  const operators = getAllowedOperatorsForColumnType(columnType, nullable);
  if (operators.length === 0) {
    return undefined;
  }

  return operators.map((operator) => ({
    label: operatorLabel(operator),
    value: operator,
  }));
}
