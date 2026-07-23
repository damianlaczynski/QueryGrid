export type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "notIn"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isNull"
  | "isNotNull"
  | "between";

export type FilterLogic = "and" | "or";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface FilterGroup {
  logic: FilterLogic;
  conditions: FilterNode[];
}

export type FilterNode = FilterCondition | FilterGroup;

export interface SortDescriptor {
  field: string;
  desc?: boolean;
}

export interface GridQuery {
  skip?: number | null;
  take?: number | null;
  sort?: SortDescriptor[];
  filter?: FilterNode | null;
  search?: string | null;
}

export interface GridResult<T> {
  items: T[];
  totalCount: number;
  skip: number;
  take: number;
  sort: SortDescriptor[];
}

export interface GridOptions {
  defaultPageSize?: number;
  maxTake?: number;
  maxSortDescriptors?: number;
}

export const DEFAULT_GRID_OPTIONS: Required<GridOptions> = {
  defaultPageSize: 20,
  maxTake: 100,
  maxSortDescriptors: 5,
};

export function isFilterGroup(node: FilterNode): node is FilterGroup {
  return "logic" in node && "conditions" in node;
}

export function isFilterCondition(node: FilterNode): node is FilterCondition {
  return "field" in node && "operator" in node;
}

export function createEmptyGridQuery(options?: GridOptions): GridQuery {
  return {
    skip: 0,
    take: options?.defaultPageSize ?? DEFAULT_GRID_OPTIONS.defaultPageSize,
    sort: [],
  };
}

export function clampTake(take: number | null | undefined, options?: GridOptions): number {
  const maxTake = options?.maxTake ?? DEFAULT_GRID_OPTIONS.maxTake;
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_GRID_OPTIONS.defaultPageSize;
  const resolved = take ?? defaultPageSize;
  return Math.min(Math.max(0, resolved), maxTake);
}

export function pageToSkip(page: number, take: number): number {
  return Math.max(0, (page - 1) * take);
}

export function skipToPage(skip: number, take: number): number {
  if (take <= 0) {
    return 1;
  }

  return Math.floor(skip / take) + 1;
}

export function totalPages(totalCount: number, take: number): number {
  if (take <= 0) {
    return 0;
  }

  return Math.ceil(totalCount / take);
}

export function clampSortDescriptors(
  sort: SortDescriptor[] | null | undefined,
  max = DEFAULT_GRID_OPTIONS.maxSortDescriptors,
): SortDescriptor[] {
  return (sort ?? []).slice(0, max);
}

export function flattenFilterConditions(
  node: FilterNode | null | undefined,
  result: FilterCondition[] = [],
): FilterCondition[] {
  if (!node) {
    return result;
  }

  if (isFilterCondition(node)) {
    result.push(node);
    return result;
  }

  if (isFilterGroup(node)) {
    for (const child of node.conditions) {
      flattenFilterConditions(child, result);
    }
  }

  return result;
}

function sameFilterValue(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a == null || b == null) {
    return a == null && b == null;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => sameFilterValue(item, b[index]));
  }

  return false;
}

export function sameFilterNode(
  a: FilterNode | null | undefined,
  b: FilterNode | null | undefined,
): boolean {
  if (a == null && b == null) {
    return true;
  }

  if (a == null || b == null) {
    return false;
  }

  if (isFilterCondition(a) && isFilterCondition(b)) {
    return a.field === b.field && a.operator === b.operator && sameFilterValue(a.value, b.value);
  }

  if (isFilterGroup(a) && isFilterGroup(b)) {
    if (a.logic !== b.logic || a.conditions.length !== b.conditions.length) {
      return false;
    }

    return a.conditions.every((child, index) => sameFilterNode(child, b.conditions[index]));
  }

  return false;
}

export function areSortDescriptorsEqual(
  a: SortDescriptor[] | null | undefined,
  b: SortDescriptor[] | null | undefined,
): boolean {
  const left = a ?? [];
  const right = b ?? [];

  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (item, index) =>
      item.field === right[index].field && Boolean(item.desc) === Boolean(right[index].desc),
  );
}
