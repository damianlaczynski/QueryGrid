import type { QgMessageTranslateFn } from "@query-grid/core";
import type { SelectItem } from "primeng/api";
import { FilterMatchMode } from "primeng/api";
import type { GridColumnFilterType } from "./table/grid-column";

function resolveTranslate(translate?: QgMessageTranslateFn): QgMessageTranslateFn {
  return translate ?? ((_key, fallback) => fallback);
}

/** Match modes for enum columns (`in` / `notIn`, plus null checks when nullable). */
export function buildEnumMatchModeOptions(
  translate?: QgMessageTranslateFn,
  nullable = false,
): SelectItem[] {
  const t = resolveTranslate(translate);
  const modes: SelectItem[] = [
    { label: t("filter.operator.in", "In"), value: "in" },
    { label: t("filter.operator.notIn", "Not in"), value: "notIn" },
  ];

  if (nullable) {
    modes.push(
      { label: t("filter.operator.equals", "Equals"), value: FilterMatchMode.EQUALS },
      { label: t("filter.operator.notEquals", "Not equals"), value: FilterMatchMode.NOT_EQUALS },
      { label: t("filter.operator.isEmpty", "Is empty"), value: FilterMatchMode.IS },
      { label: t("filter.operator.isNotEmpty", "Is not empty"), value: FilterMatchMode.IS_NOT },
    );
  }

  return modes;
}

/** Match modes for nullable columns, including PrimeNG `is` / `isNot` (empty / not empty). */
export function buildNullableMatchModeOptions(
  columnType: GridColumnFilterType | undefined,
  translate?: QgMessageTranslateFn,
): SelectItem[] | undefined {
  const t = resolveTranslate(translate);

  switch (columnType) {
    case "text":
      return [
        {
          label: t("filter.operator.startsWith", "Starts with"),
          value: FilterMatchMode.STARTS_WITH,
        },
        { label: t("filter.operator.contains", "Contains"), value: FilterMatchMode.CONTAINS },
        {
          label: t("filter.operator.notContains", "Not contains"),
          value: FilterMatchMode.NOT_CONTAINS,
        },
        { label: t("filter.operator.endsWith", "Ends with"), value: FilterMatchMode.ENDS_WITH },
        { label: t("filter.operator.equals", "Equals"), value: FilterMatchMode.EQUALS },
        { label: t("filter.operator.notEquals", "Not equals"), value: FilterMatchMode.NOT_EQUALS },
        { label: t("filter.operator.isEmpty", "Is empty"), value: FilterMatchMode.IS },
        { label: t("filter.operator.isNotEmpty", "Is not empty"), value: FilterMatchMode.IS_NOT },
      ];
    case "number":
      return [
        { label: t("filter.operator.equals", "Equals"), value: FilterMatchMode.EQUALS },
        { label: t("filter.operator.notEquals", "Not equals"), value: FilterMatchMode.NOT_EQUALS },
        { label: t("filter.operator.lessThan", "Less than"), value: FilterMatchMode.LESS_THAN },
        {
          label: t("filter.operator.lessOrEqual", "Less or equal"),
          value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
        },
        {
          label: t("filter.operator.greaterThan", "Greater than"),
          value: FilterMatchMode.GREATER_THAN,
        },
        {
          label: t("filter.operator.greaterOrEqual", "Greater or equal"),
          value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO,
        },
        { label: t("filter.operator.isEmpty", "Is empty"), value: FilterMatchMode.IS },
        { label: t("filter.operator.isNotEmpty", "Is not empty"), value: FilterMatchMode.IS_NOT },
      ];
    case "date":
      return [
        { label: t("filter.operator.dateIs", "Date is"), value: FilterMatchMode.DATE_IS },
        {
          label: t("filter.operator.dateIsNot", "Date is not"),
          value: FilterMatchMode.DATE_IS_NOT,
        },
        {
          label: t("filter.operator.dateBefore", "Date before"),
          value: FilterMatchMode.DATE_BEFORE,
        },
        { label: t("filter.operator.dateAfter", "Date after"), value: FilterMatchMode.DATE_AFTER },
        { label: t("filter.operator.isEmpty", "Is empty"), value: FilterMatchMode.IS },
        { label: t("filter.operator.isNotEmpty", "Is not empty"), value: FilterMatchMode.IS_NOT },
      ];
    default:
      return undefined;
  }
}
