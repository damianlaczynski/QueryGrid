import {
  flattenFilterConditions,
  formatFilterDisplayValue,
  isFilterCondition,
  type FilterCondition,
  type FilterNode,
  type FilterOperator,
  type GridQuery,
} from "@query-grid/core";
import type { GridColumn } from "./table/grid-column";

export type GridFilterChip = {
  id: string;
  kind: "search" | "column";
  field?: string;
  operator?: FilterOperator;
  label: string;
};

function formatValue(column: GridColumn | undefined, value: unknown): string {
  return formatFilterDisplayValue(column?.filter?.type, value);
}

function describeCondition(
  column: GridColumn | undefined,
  condition: FilterCondition,
): string {
  const header = column?.header ?? condition.field;
  const value = condition.value;

  switch (condition.operator) {
    case "contains":
      return `${header}: ${String(value ?? "")}`;
    case "notContains":
      return `${header}: not ${String(value ?? "")}`;
    case "startsWith":
      return `${header}: starts with ${String(value ?? "")}`;
    case "endsWith":
      return `${header}: ends with ${String(value ?? "")}`;
    case "eq":
      if (column?.filter?.type === "boolean") {
        const trueLabel = column.filter.trueLabel ?? "Yes";
        const falseLabel = column.filter.falseLabel ?? "No";
        return `${header}: ${value ? trueLabel : falseLabel}`;
      }
      return `${header}: ${formatValue(column, value)}`;
    case "ne":
      return `${header}: not ${formatValue(column, value)}`;
    case "in": {
      const options = column?.filter?.options ?? [];
      const values = Array.isArray(value) ? value : [value];
      const labels = values.map((entry) => {
        const option = options.find((candidate) => candidate.value === entry);
        return option ? option.label : String(entry);
      });
      return `${header}: ${labels.join(", ")}`;
    }
    case "notIn": {
      const options = column?.filter?.options ?? [];
      const values = Array.isArray(value) ? value : [value];
      const labels = values.map((entry) => {
        const option = options.find((candidate) => candidate.value === entry);
        return option ? option.label : String(entry);
      });
      return `${header}: not ${labels.join(", ")}`;
    }
    case "between": {
      const range = Array.isArray(value) ? value : [];
      return `${header}: ${formatValue(column, range[0])} – ${formatValue(column, range[1])}`;
    }
    case "gte":
      return `${header}: ≥ ${formatValue(column, value)}`;
    case "lte":
      return `${header}: ≤ ${formatValue(column, value)}`;
    case "gt":
      return `${header}: > ${formatValue(column, value)}`;
    case "lt":
      return `${header}: < ${formatValue(column, value)}`;
    case "isNull":
      return `${header}: is empty`;
    case "isNotNull":
      return `${header}: is not empty`;
    default:
      return `${header}: ${formatValue(column, value)}`;
  }
}

/** Builds removable filter chips from the current grid query and column metadata. */
export function buildGridFilterChips(
  query: GridQuery,
  columns: GridColumn[],
): GridFilterChip[] {
  const chips: GridFilterChip[] = [];
  const columnByField = new Map(
    columns.map((column) => [column.field, column]),
  );

  const search = query.search?.trim();
  if (search) {
    chips.push({
      id: "search",
      kind: "search",
      label: `Search: ${search}`,
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
      label: describeCondition(column, condition),
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
