import {
  flattenFilterConditions,
  formatFilterDisplayValue,
  isFilterCondition,
  type FilterCondition,
  type FilterNode,
  type FilterOperator,
  type GridQuery,
  type QgMessageTranslateFn,
} from "@query-grid/core";
import type { GridColumn } from "./table/grid-column";

export type GridFilterChip = {
  id: string;
  kind: "search" | "column";
  field?: string;
  operator?: FilterOperator;
  label: string;
};

export type BuildGridFilterChipsOptions = {
  translate?: QgMessageTranslateFn;
};

function formatValue(column: GridColumn | undefined, value: unknown): string {
  return formatFilterDisplayValue(column?.filter?.type, value);
}

function describeCondition(
  column: GridColumn | undefined,
  condition: FilterCondition,
  t: QgMessageTranslateFn,
): string {
  const header = column?.header ?? condition.field;
  const value = condition.value;
  const formatted = formatValue(column, value);
  const text = String(value ?? "");

  switch (condition.operator) {
    case "contains":
      return t("filter.chip.contains", `${header}: ${text}`, { header, value: text });
    case "notContains":
      return t("filter.chip.notContains", `${header}: not ${text}`, { header, value: text });
    case "startsWith":
      return t("filter.chip.startsWith", `${header}: starts with ${text}`, { header, value: text });
    case "endsWith":
      return t("filter.chip.endsWith", `${header}: ends with ${text}`, { header, value: text });
    case "eq":
      if (column?.filter?.type === "boolean") {
        const trueLabel = column.filter.trueLabel ?? t("filter.boolean.yes", "Yes");
        const falseLabel = column.filter.falseLabel ?? t("filter.boolean.no", "No");
        const boolLabel = value ? trueLabel : falseLabel;
        return t("filter.chip.equals", `${header}: ${boolLabel}`, { header, value: boolLabel });
      }
      return t("filter.chip.equals", `${header}: ${formatted}`, { header, value: formatted });
    case "ne":
      return t("filter.chip.notEquals", `${header}: not ${formatted}`, {
        header,
        value: formatted,
      });
    case "in": {
      const options = column?.filter?.options ?? [];
      const values = Array.isArray(value) ? value : [value];
      const labels = values.map((entry) => {
        const option = options.find((candidate) => candidate.value === entry);
        return option ? option.label : String(entry);
      });
      const joined = labels.join(", ");
      return t("filter.chip.in", `${header}: ${joined}`, { header, value: joined });
    }
    case "notIn": {
      const options = column?.filter?.options ?? [];
      const values = Array.isArray(value) ? value : [value];
      const labels = values.map((entry) => {
        const option = options.find((candidate) => candidate.value === entry);
        return option ? option.label : String(entry);
      });
      const joined = labels.join(", ");
      return t("filter.chip.notIn", `${header}: not ${joined}`, { header, value: joined });
    }
    case "between": {
      const range = Array.isArray(value) ? value : [];
      const start = formatValue(column, range[0]);
      const end = formatValue(column, range[1]);
      return t("filter.chip.between", `${header}: ${start} – ${end}`, {
        header,
        start,
        end,
      });
    }
    case "gte":
      return t("filter.chip.gte", `${header}: ≥ ${formatted}`, { header, value: formatted });
    case "lte":
      return t("filter.chip.lte", `${header}: ≤ ${formatted}`, { header, value: formatted });
    case "gt":
      return t("filter.chip.gt", `${header}: > ${formatted}`, { header, value: formatted });
    case "lt":
      return t("filter.chip.lt", `${header}: < ${formatted}`, { header, value: formatted });
    case "isNull":
      return t("filter.chip.isEmpty", `${header}: is empty`, { header });
    case "isNotNull":
      return t("filter.chip.isNotEmpty", `${header}: is not empty`, { header });
    default:
      return t("filter.chip.default", `${header}: ${formatted}`, { header, value: formatted });
  }
}

/** Builds removable filter chips from the current grid query and column metadata. */
export function buildGridFilterChips(
  query: GridQuery,
  columns: GridColumn[],
  options?: BuildGridFilterChipsOptions,
): GridFilterChip[] {
  const t: QgMessageTranslateFn = options?.translate ?? ((_key, fallback) => fallback);

  const chips: GridFilterChip[] = [];
  const columnByField = new Map(columns.map((column) => [column.field, column]));

  const search = query.search?.trim();
  if (search) {
    chips.push({
      id: "search",
      kind: "search",
      label: t("filter.chip.search", `Search: ${search}`, { value: search }),
    });
  }

  const conditions = flattenFilterConditions(query.filter);

  for (const condition of conditions) {
    const column = columnByField.get(condition.field);
    chips.push({
      id: `column-${condition.field}-${condition.operator}-${String(condition.value)}-${chips.length}`,
      kind: "column",
      field: condition.field,
      operator: condition.operator,
      label: describeCondition(column, condition, t),
    });
  }

  return chips;
}

/** Removes one filter condition from the filter tree. */
export function removeFilterCondition(
  filter: FilterNode | null | undefined,
  target: { field: string; operator?: FilterOperator },
): FilterNode | null {
  if (!filter) {
    return null;
  }

  if (isFilterCondition(filter)) {
    if (filter.field !== target.field) {
      return filter;
    }
    if (target.operator && filter.operator !== target.operator) {
      return filter;
    }
    return null;
  }

  const nextConditions = filter.conditions
    .map((child) => removeFilterCondition(child, target))
    .filter((child): child is FilterNode => child !== null);

  if (nextConditions.length === 0) {
    return null;
  }

  if (nextConditions.length === 1 && isFilterCondition(nextConditions[0])) {
    return nextConditions[0];
  }

  return { logic: filter.logic, conditions: nextConditions };
}
