import type {
  FilterCondition,
  FilterLogic,
  FilterNode,
  FilterOperator,
  GridQuery,
} from "@query-grid/core";
import { coerceOperatorForColumnType, isFilterCondition, isFilterGroup } from "@query-grid/core";
import type { FilterMetadata } from "primeng/api";
import { FilterOperator as PrimeFilterOperator } from "primeng/api";
import type { Table } from "primeng/table";
import { mapSortToPrimeMeta } from "./sort-mapper";
import type { GridColumn } from "./table/grid-column";

function mapMatchMode(matchMode?: string): FilterOperator | null {
  switch (matchMode) {
    case "contains":
      return "contains";
    case "notContains":
      return "notContains";
    case "startsWith":
      return "startsWith";
    case "endsWith":
      return "endsWith";
    case "equals":
    case "dateIs":
      return "eq";
    case "notEquals":
    case "dateIsNot":
      return "ne";
    case "in":
      return "in";
    case "notIn":
      return "notIn";
    case "between":
      return "between";
    case "lt":
    case "dateBefore":
      return "lt";
    case "lte":
      return "lte";
    case "gt":
    case "dateAfter":
      return "gt";
    case "gte":
      return "gte";
    case "is":
      return "isNull";
    case "isNot":
      return "isNotNull";
    default:
      return null;
  }
}

const STRING_OPERATORS: FilterOperator[] = ["contains", "notContains", "startsWith", "endsWith"];

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fixOperatorFromValue(operator: FilterOperator, value: unknown): FilterOperator {
  if (typeof value === "boolean") {
    return operator === "ne" ? "ne" : "eq";
  }

  if (typeof value === "number") {
    return STRING_OPERATORS.includes(operator) ? "eq" : operator;
  }

  if (typeof value === "string" && GUID_PATTERN.test(value)) {
    if (!["eq", "ne", "in", "notIn"].includes(operator)) {
      return "eq";
    }
  }

  return operator;
}

function resolveOperatorForColumn(
  meta: FilterMetadata,
  column: GridColumn | undefined,
): FilterOperator | null {
  const mapped = mapMatchMode(meta.matchMode);
  if (!mapped) {
    return null;
  }

  const columnType = column?.filter?.type;
  const nullable = column?.filter?.nullable;
  if (columnType) {
    if (columnType === "text" || columnType === "guid") {
      return mapped;
    }
    return coerceOperatorForColumnType(mapped, columnType, nullable);
  }

  return fixOperatorFromValue(mapped, meta.value);
}

/** PrimeNG match mode used when clearing a column filter in the table UI. */
export function defaultPrimeMatchMode(column: GridColumn): string {
  switch (column.filter?.type) {
    case "text":
      return "contains";
    case "enum":
      return "in";
    case "date":
      return "dateIs";
    default:
      return "equals";
  }
}

function isNullCheckMatchMode(matchMode?: string): boolean {
  return matchMode === "is" || matchMode === "isNot";
}

function isEmptyFilterValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function readFilterEntries(
  filters: Record<string, FilterMetadata | FilterMetadata[]> | undefined,
): Array<{ field: string; meta: FilterMetadata }> {
  if (!filters) {
    return [];
  }

  const entries: Array<{ field: string; meta: FilterMetadata }> = [];

  for (const [field, metadata] of Object.entries(filters)) {
    const items = Array.isArray(metadata) ? metadata : [metadata];
    for (const meta of items) {
      entries.push({ field, meta });
    }
  }

  return entries;
}

/** Maps PrimeNG lazy-load filter metadata to a QueryGrid filter tree. */
export function mapPrimeFiltersToGridFilter(
  filters: Record<string, FilterMetadata | FilterMetadata[]> | undefined,
  columns: GridColumn[],
): FilterNode | null {
  const columnByField = new Map(columns.map((column) => [column.field, column]));
  const byField = new Map<string, { logic: FilterLogic; conditions: FilterCondition[] }>();

  for (const { field, meta } of readFilterEntries(filters)) {
    if (field === "global") {
      continue;
    }

    if (!isNullCheckMatchMode(meta.matchMode) && isEmptyFilterValue(meta.value)) {
      continue;
    }

    const column = columnByField.get(field);
    if (!column) {
      continue;
    }

    const operator = resolveOperatorForColumn(meta, column);

    if (!operator) {
      continue;
    }

    const condition: FilterCondition = { field, operator };
    if (operator !== "isNull" && operator !== "isNotNull") {
      condition.value = meta.value;
    }

    const logic: FilterLogic =
      meta.operator === PrimeFilterOperator.OR || meta.operator === "or" ? "or" : "and";
    const entry = byField.get(field) ?? { logic, conditions: [] };
    entry.logic = logic;
    entry.conditions.push(condition);
    byField.set(field, entry);
  }

  const nodes: FilterNode[] = [];
  for (const [, entry] of byField) {
    if (entry.conditions.length === 1) {
      nodes.push(entry.conditions[0]);
    } else {
      nodes.push({ logic: entry.logic, conditions: entry.conditions });
    }
  }

  if (nodes.length === 0) {
    return null;
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  return { logic: "and", conditions: nodes };
}

function mapOperatorToMatchMode(operator: FilterOperator, columnType?: string): string {
  const isDate = columnType === "date";

  switch (operator) {
    case "contains":
      return "contains";
    case "notContains":
      return "notContains";
    case "startsWith":
      return "startsWith";
    case "endsWith":
      return "endsWith";
    case "in":
      return "in";
    case "notIn":
      return "notIn";
    case "between":
      return "between";
    case "eq":
      return isDate ? "dateIs" : "equals";
    case "ne":
      return isDate ? "dateIsNot" : "notEquals";
    case "lt":
      return isDate ? "dateBefore" : "lt";
    case "lte":
      return "lte";
    case "gt":
      return isDate ? "dateAfter" : "gt";
    case "gte":
      return "gte";
    case "isNull":
      return "is";
    case "isNotNull":
      return "isNot";
    default:
      return "equals";
  }
}

function reviveFilterValue(value: unknown, columnType?: string): unknown {
  if (columnType !== "date") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => reviveDateValue(entry));
  }

  return reviveDateValue(value);
}

function reviveDateValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }

  return value;
}

/** Builds PrimeNG column filter metadata from a persisted {@link GridQuery} filter tree. */
export function buildPrimeTableFilters(
  filter: FilterNode | null | undefined,
  columns: GridColumn[],
): Record<string, FilterMetadata[]> {
  const columnByField = new Map(columns.map((column) => [column.field, column]));
  const result: Record<string, FilterMetadata[]> = {};

  for (const [field, entry] of collectFieldFilters(filter)) {
    const column = columnByField.get(field);
    const primeOperator = entry.logic === "or" ? PrimeFilterOperator.OR : PrimeFilterOperator.AND;

    result[field] = entry.conditions.map((condition) => ({
      value:
        condition.operator === "isNull" || condition.operator === "isNotNull"
          ? null
          : reviveFilterValue(condition.value, column?.filter?.type),
      matchMode: mapOperatorToMatchMode(condition.operator, column?.filter?.type),
      operator: primeOperator,
    }));
  }

  return result;
}

function collectFieldFilters(
  filter: FilterNode | null | undefined,
): Map<string, { logic: FilterLogic; conditions: FilterCondition[] }> {
  const result = new Map<string, { logic: FilterLogic; conditions: FilterCondition[] }>();
  if (!filter) {
    return result;
  }

  if (isFilterCondition(filter)) {
    result.set(filter.field, { logic: "and", conditions: [filter] });
    return result;
  }

  if (!isFilterGroup(filter)) {
    return result;
  }

  for (const child of filter.conditions) {
    if (isFilterCondition(child)) {
      const existing = result.get(child.field);
      if (existing) {
        existing.conditions.push(child);
      } else {
        result.set(child.field, { logic: filter.logic, conditions: [child] });
      }
      continue;
    }

    if (!isFilterGroup(child)) {
      continue;
    }

    const childConditions = child.conditions.filter(isFilterCondition);
    if (
      childConditions.length > 0 &&
      childConditions.length === child.conditions.length &&
      childConditions.every((condition) => condition.field === childConditions[0].field)
    ) {
      result.set(childConditions[0].field, {
        logic: child.logic,
        conditions: childConditions,
      });
      continue;
    }

    for (const [field, value] of collectFieldFilters(child)) {
      result.set(field, value);
    }
  }

  return result;
}

/** Updates one column's PrimeNG filter metadata without clearing sibling constraints. */
export function syncPrimeTableFieldFilters(
  table: Table,
  field: string,
  filter: FilterNode | null | undefined,
  columns: GridColumn[],
): void {
  const rebuilt = buildPrimeTableFilters(filter, columns);
  const nextFilters = {
    ...((table.filters ?? {}) as Record<string, FilterMetadata | FilterMetadata[]>),
  };

  if (!rebuilt[field]?.length) {
    delete nextFilters[field];
  } else {
    nextFilters[field] = rebuilt[field];
  }

  table.filters = nextFilters;
}

/** Applies persisted {@link GridQuery} constraints to a PrimeNG table instance. */
export function applyGridQueryToPrimeTable(
  table: Table,
  query: Partial<GridQuery>,
  columns: GridColumn[],
): void {
  const search = query.search?.trim();
  table.filterGlobal(search ?? "", "contains");

  const columnFilters = buildPrimeTableFilters(query.filter, columns);
  const managedFields = new Set(
    columns.filter((column) => column.filter).map((column) => column.field),
  );
  const existingFilters = (table.filters ?? {}) as Record<
    string,
    FilterMetadata | FilterMetadata[]
  >;
  const nextFilters: Record<string, FilterMetadata | FilterMetadata[]> = {};

  for (const [field, metadata] of Object.entries(existingFilters)) {
    if (!managedFields.has(field)) {
      nextFilters[field] = metadata;
    }
  }

  table.filters = {
    ...nextFilters,
    ...columnFilters,
  };

  table.multiSortMeta = mapSortToPrimeMeta(query.sort);
}
