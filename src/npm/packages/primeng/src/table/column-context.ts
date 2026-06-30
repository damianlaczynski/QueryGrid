export interface QgColumnContext<T = unknown> {
  $implicit: T;
  row: T;
  column: string;
}
