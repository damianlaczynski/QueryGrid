# Grid export — implementation plan

> Status: **planned** (not implemented). Companion to row selection and bulk toolbar in `@query-grid/ui` / `@query-grid/primeng`.

## Goals

1. Let apps export grid data without reimplementing CSV/JSON plumbing.
2. Support the three export scopes users expect from a data grid.
3. Keep server authority for large datasets and permission checks.
4. Compose with existing `GridQuery`, row selection, column visibility, and column layout.

## Non-goals (v1)

- Excel `.xlsx` generation in the browser (defer; CSV covers most cases).
- Client-side export of the full filtered dataset without a server round-trip.
- Export column formatting rules beyond plain string/number/date serialization.

## Export scopes

| Scope | Source data | Typical use |
| ----- | ----------- | ----------- |
| **Current page** | `grid.items()` | Quick dump of visible rows |
| **Selected rows** | Rows matching `grid.selectedKeys()` + `dataKey` | Bulk actions, partial export |
| **All matching** | Server applies current `grid.query()` (no `skip`, capped `take`) | Full export of filtered result |

### Selected rows — two sub-modes (later)

| Mode | When |
| ---- | ---- |
| **Explicit keys** | User picked individual rows (`selectedKeys`) |
| **All matching minus excluded** | Future “select all N results” (not in v1) |

## Package layout

### `@query-grid/core`

Pure helpers (no DOM):

```typescript
// grid-export.ts (proposed)
export interface GridExportColumn {
  field: string;
  header: string;
}

export interface GridExportOptions {
  columns: readonly GridExportColumn[];
  filename?: string;
  delimiter?: string; // default ","
  includeHeaders?: boolean; // default true
}

export function buildCsv(rows: readonly Record<string, unknown>[], options: GridExportOptions): string;
export function downloadTextFile(content: string, filename: string, mimeType?: string): void;
export function resolveExportRows<T>(
  items: readonly T[],
  selectedKeys: ReadonlySet<string> | undefined,
  resolveKey: (row: T) => string | null,
): readonly T[];
```

- `buildCsv` — RFC-friendly escaping (quotes, newlines).
- `downloadTextFile` — thin wrapper over `Blob` + object URL (guard `typeof document`).
- `resolveExportRows` — filter `items` by `selectedKeys` when provided; otherwise return all items.

### `@query-grid/ui` and `@query-grid/primeng`

Optional convenience (thin wrappers):

```typescript
export function exportGridPageToCsv<T>(/* grid, columns, dataKey? */): void;
export function exportGridSelectionToCsv<T>(/* grid, columns, dataKey */): void;
```

No new grid option flags in v1 — apps call helpers from `[qgBulkToolbar]` buttons or toolbar actions.

### Server (.NET) — optional sample / doc only in v1

Document pattern; implement in showcase if useful:

```csharp
// GET /issues/export?grid={json}&format=csv
// or POST with GridQuery body for large filters
```

- Reuse `ToGridResultAsync` with `skip: 0`, `take: exportMax` (e.g. 10_000).
- Apply same authZ as list endpoint.
- Stream CSV response (`text/csv`) or return file download.

## API design (frontend)

### Phase 1 — client-only (recommended first PR)

| API | Description |
| --- | ----------- |
| `buildCsv` | Core serialization |
| `downloadCsv` | `buildCsv` + `downloadTextFile` |
| `exportCurrentPage` | Uses `grid.items()` + visible columns from caller |
| `exportSelectedRows` | Uses `selectedKeys` + current page items (keys on other pages need server) |

**Column list:** caller passes `GridExportColumn[]` derived from `qgColumn` metadata or a static list. Do not read Angular templates in v1.

**Showcase:** replace `alert()` in `exportSelected()` with real CSV download.

### Phase 2 — server export

| API | Description |
| --- | ----------- |
| `buildExportQuery(query)` | `GridQuery` with `skip: 0`, `take: maxExportTake` |
| Showcase endpoint | `GET /rows/export?grid=` returning CSV |
| UI button | “Export all matching” in toolbar or bulk area |

### Phase 3 — select all matching (ties to future selection work)

- Selection state: `{ mode: "allMatching", excludedKeys: Set<string> }` or explicit keys.
- Export POST: `{ grid: GridQuery, selection: { allMatching: true, excludedKeys: [] } }`.
- Out of scope until row-selection “select all N” exists.

## Column resolution

Export respects **visible** columns when the app passes them:

1. App maps `displayedColumns` / static config → `GridExportColumn[]`.
2. Optional helper: `pickExportColumns(columns, hiddenFields)` using `columnChooser` state.
3. Column order: layout `columnOrder` when `columnLayout` is enabled (read from grid resource).

Cell values: `row[field]` with simple formatting:

- `null` / `undefined` → empty string
- `Date` → ISO or `formatLocalDateTime` from core
- `boolean` → `true` / `false`
- objects → `JSON.stringify` (edge case)

## UX guidelines

- **Export selected** — in `[qgBulkToolbar]` when `selectedCount() > 0` (already shown).
- **Export page** — toolbar action (optional).
- **Export all** — toolbar; confirm dialog when `totalCount > threshold`.
- Disable while `grid.loading()`.
- Filename pattern: `{entity}-{yyyy-MM-dd}.csv`.

## Testing

| Layer | Tests |
| ----- | ----- |
| `@query-grid/core` | CSV escaping, empty rows, selected key filter, date/boolean formatting |
| npm integration | Optional smoke: build CSV from fixture rows |
| Showcase | Manual: export page, export selection, open in Excel / LibreOffice |
| .NET (phase 2) | Export endpoint returns same rows as grid query; respects `maxTake` cap |

## Implementation order

```text
PR 1 (core + showcase)
  grid-export.ts + unit tests
  exportCurrentPage / exportSelectedRows in ui + primeng (re-export from core)
  Showcase demo buttons

PR 2 (docs + server sample)
  getting-started.md “Export” section
  showcase-api CSV endpoint
  buildExportQuery helper

PR 3 (future)
  Select all matching + server-side bulk export contract
```

## Open decisions

1. **Max export rows** — default 10_000? Configurable per app?
2. **UTF-8 BOM** — prepend for Excel on Windows? (recommended: yes, optional flag).
3. **Package surface** — core only vs thin Angular helpers in ui/primeng (recommended: both).
4. **Permissions** — export endpoint same policy as list, or separate claim?

## References

- Row selection: [getting-started.md](../getting-started.md#row-selection-and-bulk-actions)
- `GridQuery` transport: [getting-started.md](../getting-started.md#json-shape)
- Showcase bulk demo: `samples/showcase-ui/src/app/ui-showcase-page.component.ts`
