import type { FilterOperator, QgMessageTranslateFn } from "@query-grid/core";
import { getAllowedOperatorsForColumnType } from "@query-grid/core";
import type { GridColumnFilterType } from "./table/grid-column";

export interface MatchModeOption {
  label: string;
  value: FilterOperator;
}

function resolveTranslate(translate?: QgMessageTranslateFn): QgMessageTranslateFn {
  return translate ?? ((_key, fallback) => fallback);
}

export function buildEnumMatchModeOptions(
  nullable = false,
  translate?: QgMessageTranslateFn,
): MatchModeOption[] {
  const t = resolveTranslate(translate);
  const modes: MatchModeOption[] = [
    { label: t("filter.operator.in", "In"), value: "in" },
    { label: t("filter.operator.notIn", "Not in"), value: "notIn" },
  ];

  if (nullable) {
    modes.push(
      { label: t("filter.operator.equals", "Equals"), value: "eq" },
      { label: t("filter.operator.notEquals", "Not equals"), value: "ne" },
      { label: t("filter.operator.isEmpty", "Is empty"), value: "isNull" },
      { label: t("filter.operator.isNotEmpty", "Is not empty"), value: "isNotNull" },
    );
  }

  return modes;
}

function operatorLabel(operator: FilterOperator, t: QgMessageTranslateFn): string {
  switch (operator) {
    case "contains":
      return t("filter.operator.contains", "Contains");
    case "notContains":
      return t("filter.operator.notContains", "Not contains");
    case "startsWith":
      return t("filter.operator.startsWith", "Starts with");
    case "endsWith":
      return t("filter.operator.endsWith", "Ends with");
    case "eq":
      return t("filter.operator.equals", "Equals");
    case "ne":
      return t("filter.operator.notEquals", "Not equals");
    case "lt":
      return t("filter.operator.lessThan", "Less than");
    case "lte":
      return t("filter.operator.lessOrEqual", "Less or equal");
    case "gt":
      return t("filter.operator.greaterThan", "Greater than");
    case "gte":
      return t("filter.operator.greaterOrEqual", "Greater or equal");
    case "between":
      return t("filter.operator.between", "Between");
    case "in":
      return t("filter.operator.in", "In");
    case "notIn":
      return t("filter.operator.notIn", "Not in");
    case "isNull":
      return t("filter.operator.isEmpty", "Is empty");
    case "isNotNull":
      return t("filter.operator.isNotEmpty", "Is not empty");
    default:
      return operator;
  }
}

export function buildMatchModeOptions(
  columnType: GridColumnFilterType | undefined,
  nullable?: boolean,
  translate?: QgMessageTranslateFn,
): MatchModeOption[] | undefined {
  const t = resolveTranslate(translate);

  if (columnType === "enum") {
    return buildEnumMatchModeOptions(nullable, translate);
  }

  if (columnType === "guid") {
    return [{ label: t("filter.operator.equals", "Equals"), value: "eq" }];
  }

  const operators = getAllowedOperatorsForColumnType(columnType, nullable);
  if (operators.length === 0) {
    return undefined;
  }

  return operators.map((operator) => ({
    label: operatorLabel(operator, t),
    value: operator,
  }));
}
