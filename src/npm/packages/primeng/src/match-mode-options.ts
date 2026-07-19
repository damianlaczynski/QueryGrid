import type { SelectItem } from "primeng/api";
import { FilterMatchMode } from "primeng/api";
import type { GridColumnFilterType } from "./table/grid-column";

type TranslateFn = (key: string) => string;

/** Match modes for enum columns (`in` / `notIn`, plus null checks when nullable). */
export function buildEnumMatchModeOptions(translate: TranslateFn, nullable = false): SelectItem[] {
  const t = translate;
  const modes: SelectItem[] = [
    { label: t("in") ?? "In", value: "in" },
    { label: t("notIn") ?? "Not in", value: "notIn" },
  ];

  if (nullable) {
    modes.push(
      { label: t("equals") ?? "Equals", value: FilterMatchMode.EQUALS },
      { label: t("notEquals") ?? "Not equals", value: FilterMatchMode.NOT_EQUALS },
      { label: t("is") ?? "Is empty", value: FilterMatchMode.IS },
      { label: t("isNot") ?? "Is not empty", value: FilterMatchMode.IS_NOT },
    );
  }

  return modes;
}

/** Match modes for nullable columns, including PrimeNG `is` / `isNot` (empty / not empty). */
export function buildNullableMatchModeOptions(
  columnType: GridColumnFilterType | undefined,
  translate: TranslateFn,
): SelectItem[] | undefined {
  const t = translate;

  switch (columnType) {
    case "text":
      return [
        { label: t("startsWith"), value: FilterMatchMode.STARTS_WITH },
        { label: t("contains"), value: FilterMatchMode.CONTAINS },
        { label: t("notContains"), value: FilterMatchMode.NOT_CONTAINS },
        { label: t("endsWith"), value: FilterMatchMode.ENDS_WITH },
        { label: t("equals"), value: FilterMatchMode.EQUALS },
        { label: t("notEquals"), value: FilterMatchMode.NOT_EQUALS },
        { label: t("is"), value: FilterMatchMode.IS },
        { label: t("isNot"), value: FilterMatchMode.IS_NOT },
      ];
    case "number":
      return [
        { label: t("equals"), value: FilterMatchMode.EQUALS },
        { label: t("notEquals"), value: FilterMatchMode.NOT_EQUALS },
        { label: t("lt"), value: FilterMatchMode.LESS_THAN },
        { label: t("lte"), value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO },
        { label: t("gt"), value: FilterMatchMode.GREATER_THAN },
        { label: t("gte"), value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
        { label: t("is"), value: FilterMatchMode.IS },
        { label: t("isNot"), value: FilterMatchMode.IS_NOT },
      ];
    case "date":
      return [
        { label: t("dateIs"), value: FilterMatchMode.DATE_IS },
        { label: t("dateIsNot"), value: FilterMatchMode.DATE_IS_NOT },
        { label: t("dateBefore"), value: FilterMatchMode.DATE_BEFORE },
        { label: t("dateAfter"), value: FilterMatchMode.DATE_AFTER },
        { label: t("is"), value: FilterMatchMode.IS },
        { label: t("isNot"), value: FilterMatchMode.IS_NOT },
      ];
    default:
      return undefined;
  }
}
