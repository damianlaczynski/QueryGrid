export type QgMessageTranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;
