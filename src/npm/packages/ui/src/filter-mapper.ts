import {
  isFilterCondition,
  isFilterGroup,
  type FilterCondition,
  type FilterLogic,
  type FilterNode,
  type FilterOperator,
  type GridQuery,
} from "@query-grid/core";
import type { GridColumnFilterType } from "./table/grid-column";

export function defaultOperatorForType(type: GridColumnFilterType): FilterOperator {
  switch (type) {
    case "text":
      return "contains";
    case "enum":
      return "in";
    case "boolean":
    case "number":
    case "date":
    case "guid":
      return "eq";
    default:
      return "contains";
  }
}

export function getFieldFilterConditions(
  filter: GridQuery["filter"],
  field: string,
): FilterCondition[] {
  return collectFieldFilters(filter).get(field)?.conditions ?? [];
}

export function getFieldFilterLogic(
  filter: GridQuery["filter"],
  field: string,
): FilterLogic {
  return collectFieldFilters(filter).get(field)?.logic ?? "and";
}

export function upsertFieldFilter(
  filter: GridQuery["filter"],
  field: string,
  condition: FilterCondition | FilterCondition[] | null,
  logic: FilterLogic = "and",
): FilterNode | null {
  const withoutField = removeFieldFromFilter(filter, field);
  const fieldConditions =
    condition == null ? [] : Array.isArray(condition) ? condition : [condition];

  let fieldNode: FilterNode | null = null;
  if (fieldConditions.length === 1) {
    fieldNode = fieldConditions[0];
  } else if (fieldConditions.length > 1) {
    fieldNode = { logic, conditions: fieldConditions };
  }

  if (!fieldNode) {
    return withoutField;
  }

  if (!withoutField) {
    return fieldNode;
  }

  if (isFilterGroup(withoutField) && withoutField.logic === "and") {
    return {
      logic: "and",
      conditions: [...withoutField.conditions, fieldNode],
    };
  }

  return { logic: "and", conditions: [withoutField, fieldNode] };
}

export function removeFieldFilter(
  filter: GridQuery["filter"],
  field: string,
  operator?: FilterOperator,
): FilterNode | null {
  if (!filter) {
    return null;
  }

  if (isFilterCondition(filter)) {
    if (filter.field !== field) {
      return filter;
    }

    if (operator && filter.operator !== operator) {
      return filter;
    }

    return null;
  }

  if (isFilterGroup(filter)) {
    const nextConditions = filter.conditions
      .map((child) => removeFieldFilter(child, field, operator))
      .filter((child): child is FilterNode => child !== null);

    if (nextConditions.length === 0) {
      return null;
    }

    if (nextConditions.length === 1) {
      return nextConditions[0];
    }

    return { ...filter, conditions: nextConditions };
  }

  return filter;
}

export function hasFilterValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

export function collectFieldFilters(
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

function removeFieldFromFilter(
  filter: FilterNode | null | undefined,
  field: string,
): FilterNode | null {
  if (!filter) {
    return null;
  }

  if (isFilterCondition(filter)) {
    return filter.field === field ? null : filter;
  }

  if (!isFilterGroup(filter)) {
    return filter;
  }

  const onlyThisField =
    filter.conditions.length > 0 &&
    filter.conditions.every(
      (child) => isFilterCondition(child) && child.field === field,
    );

  if (onlyThisField) {
    return null;
  }

  const nextConditions = filter.conditions
    .map((child) => removeFieldFromFilter(child, field))
    .filter((child): child is FilterNode => child !== null);

  if (nextConditions.length === 0) {
    return null;
  }

  if (nextConditions.length === 1) {
    return nextConditions[0];
  }

  return { logic: filter.logic, conditions: nextConditions };
}
