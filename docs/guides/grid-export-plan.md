# Grid export — implementation plan (server-first)

> Status: **planned** (not implemented). Companion to row selection and bulk toolbar in `@query-grid/ui` / `@query-grid/primeng`.

## Design stance

**Server-first**, DevExtreme-style UX for remote data:

- DevExtreme’s default grid export is **client-side** (ExcelJS). With a **remote** data source, exporting “everything” only works if the app cancels default export and calls the **server** with the same filter/sort as the grid.
- QueryGrid already owns **`GridQuery`** end-to-end. Export should reuse the **same filter, search, and sort** as `GET /rows`, with different paging rules and a file response — not a second ad-hoc query DSL.

Client-side CSV of the **current page** remains a small optional helper for quick dumps; it is not the primary path.

## Goals

1. First-class **server export** API in .NET (streaming CSV, capped row count, same validation as list).
2. Frontend helpers that trigger a download from the **current grid state** (`grid.query()`, `selectedKeys()`).
3. DevExtreme-like UX: toolbar export, “all matching”, “selected rows”, disabled while loading.
4. Compose with `GridQuery`, row selection, column visibility, and column layout.

## Non-goals (v1)

- Excel `.xlsx` in the browser.
- Client-side export of the full filtered dataset.
- Rich cell formatting beyond plain serialization (currency symbols, custom templates).

## Export scopes

| Scope             | Where it runs     | Data source                                                                                    |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| **All matching**  | Server            | Current `GridQuery` — filter/search/sort applied; **no `skip`**; `take` replaced by export cap |
| **Selected rows** | Server            | Same `GridQuery` + `WHERE dataKey IN (...)` from `selectedKeys` (POST body)                    |
| **Current page**  | Client (optional) | `grid.items()` — convenience only; not authoritative                                           |

### Selected rows — sub-modes

| Mode                            | v1    | Notes                                        |
| ------------------------------- | ----- | -------------------------------------------- |
| **Explicit keys**               | Yes   | `grid.selectedKeys()` sent in export request |
| **All matching minus excluded** | Later | Needs “select all N results” selection mode  |

## DevExtreme comparison

| Concern                  | DevExtreme (remote)                          | QueryGrid (proposed)                                              |
| ------------------------ | -------------------------------------------- | ----------------------------------------------------------------- |
| Export all filtered rows | Custom `onExporting` → your API              | Built-in `ToGridExportAsync` + `grid.exportAllMatching()`         |
| Export selection         | `allowExportSelectedData` (client rows only) | Server resolves keys across pages                                 |
| Query contract           | Custom                                       | Same `GridQuery` JSON as list endpoint                            |
| Formats                  | xlsx/csv in browser                          | csv on server v1; optional `QueryGrid.Export.Excel` package later |
| Large datasets           | App implements streaming                     | `IAsyncEnumerable` → response stream                              |

## .NET package layout

### `QueryGrid.Abstractions`

```csharp
public enum GridExportFormat { Csv }

public enum GridExportScope { AllMatching, SelectedKeys }

public sealed class GridExportRequest
{
  public required GridQuery Query { get; init; }
  public GridExportScope Scope { get; init; } = GridExportScope.AllMatching;
  public string[]? SelectedKeys { get; init; }
  public string DataKeyField { get; init; } = "id";
  public GridExportFormat Format { get; init; } = GridExportFormat.Csv;
  public IReadOnlyList<GridExportColumn>? Columns { get; init; }
}

public sealed class GridExportColumn
{
  public required string Field { get; init; }
  public required string Header { get; init; }
}
```

- **POST body** for export (filters + selection keys can be large).
- Optional **GET** `?grid={json}&format=csv` for simple “all matching” when query fits in URL (showcase / tooling).

### `QueryGrid.Core`

```csharp
public sealed class GridExportOptions
{
  public int MaxExportRows { get; set; } = 50_000;
  public bool IncludeUtf8Bom { get; set; } = true;  // Excel on Windows
  public string CsvDelimiter { get; set; } = ",";
}

// Plan: filter + sort, no UI paging; take = min(totalCount, MaxExportRows)
internal static GridExportPlan<T> PlanForExport<T>(...);

public static IQueryable<T> ApplyGridExport<T>(
  this IQueryable<T> source,
  GridQuery query,
  GridExportRequest request,
  GridOptions gridOptions,
  GridExportOptions exportOptions);

public static Task WriteCsvAsync<T>(
  IAsyncEnumerable<T> rows,
  IReadOnlyList<GridExportColumn> columns,
  Stream output,
  GridExportOptions? options = null,
  CancellationToken cancellationToken = default);
```

**Pipeline** (mirrors `GridResultExecutor.Plan`):

```text
source
  → ApplyGridFilterAndSearch(query)
  → [optional] filter by SelectedKeys on DataKeyField
  → ApplyEffectiveSort
  → Take(MaxExportRows)   // hard cap, separate from GridOptions.MaxTake (100)
  → stream rows → CsvGridExporter
```

- `MaxExportRows` is **not** `GridOptions.MaxTake` — list paging stays at 100; export may allow 50k with app-specific override.
- If `totalCount > MaxExportRows`, response includes header `X-Grid-Export-Truncated: true` (or JSON error if app prefers fail-fast).

### `QueryGrid.EntityFrameworkCore`

```csharp
public static Task ExportToCsvAsync<T>(
  this IQueryable<T> source,
  GridExportRequest request,
  Stream output,
  GridOptions? gridOptions = null,
  GridExportOptions? exportOptions = null,
  CancellationToken cancellationToken = default);
```

Implementation: `AsAsyncEnumerable()` + `WriteCsvAsync` — **does not** load all rows into memory.

### `QueryGrid.AspNetCore` (new small package, optional v1)

```csharp
public static RouteHandlerBuilder MapGridExport<T>(
  this IEndpointRouteBuilder routes,
  string pattern,
  Func<HttpContext, IQueryable<T>> sourceFactory);
```

- Same exception mapping as list (`GridValidationException` → 400).
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="..."`

Showcase: `POST /rows/export` alongside existing `GET /rows`.

### Security

- Reuse **same authorization** as the list endpoint (no separate export permission in v1).
- Enforce `MaxExportRows` server-side always.
- **Column whitelist**: only fields declared in `GridExportColumn[]` or grid schema — never dump arbitrary DTO properties the UI hides.
- Rate-limit / audit at app level (out of library scope).

## npm package layout

### `@query-grid/core`

```typescript
export interface GridExportColumn {
  field: string;
  header: string;
}

export interface GridExportRequest {
  query: GridQuery;
  scope: 'allMatching' | 'selectedKeys';
  selectedKeys?: string[];
  dataKeyField?: string;
  format?: 'csv';
  columns: readonly GridExportColumn[];
  filename?: string;
}

export async function downloadGridExport(
  url: string,
  request: GridExportRequest,
  init?: RequestInit,
): Promise<void>;

export function buildExportColumns(
  columns: readonly { field: string; header: string; hidden?: boolean }[],
): GridExportColumn[];

// Optional client-only helper (not primary):
export function exportCurrentPageToCsv<T>(...): void;
```

`downloadGridExport`:

1. `POST` JSON body to export URL.
2. Read `Blob`, trigger download via object URL.
3. Filename from `Content-Disposition` or `request.filename`.

### `@query-grid/ui` and `@query-grid/primeng`

Grid resource extensions:

```typescript
export(): void;  // default: all matching, csv
exportAllMatching(options?: Partial<GridExportRequest>): Promise<void>;
exportSelected(options?: Partial<GridExportRequest>): Promise<void>;
```

Factory option:

```typescript
createGridResource({
  // ...
  export: {
    url: "/api/issues/export",
    filename: "issues",
    formats: ["csv"],
    allowExportSelected: true,
    confirmAbove: 10_000, // optional confirm dialog threshold
  },
});
```

Optional toolbar control (DevExtreme-like):

```html
<qg-ui-data-grid [export]="exportConfig" ...></qg-ui-data-grid>
```

- Export button in toolbar (not only bulk toolbar).
- “Export all” always available; “Export selected” when `selectedCount() > 0` and `allowExportSelected`.

Column list: map visible columns from column chooser / layout state → `buildExportColumns(...)`.

## UX guidelines

| Action              | Placement                  | Behavior                                                        |
| ------------------- | -------------------------- | --------------------------------------------------------------- |
| Export all matching | Toolbar                    | POST current `grid.query()` without client-side paging concerns |
| Export selected     | Bulk toolbar + export menu | POST query + `selectedKeys`                                     |
| Export page         | Toolbar submenu (optional) | Client CSV from `grid.items()`                                  |
| Loading             | All export actions         | Disabled while `grid.loading()`                                 |
| Large export        | Confirm dialog             | When `totalCount() > confirmAbove`                              |

Filename: `{entity}-{yyyy-MM-dd}.csv`.

## Testing

| Layer                           | Tests                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `QueryGrid.Core`                | Export plan: same filter/sort as list; cap; selected keys filter; CSV escaping; UTF-8 BOM |
| `QueryGrid.EntityFrameworkCore` | Integration: export rows ⊆ list query; streaming does not OOM on large sets               |
| `@query-grid/core`              | `downloadGridExport` mock fetch; `buildExportColumns`                                     |
| Showcase                        | Manual: export all, export selection, open in Excel                                       |

## Implementation order

```text
PR 1 — .NET server foundation
  GridExportRequest, GridExportOptions, ApplyGridExport, CsvGridExporter
  ExportToCsvAsync (EF Core)
  Unit + integration tests
  showcase-api POST /rows/export

PR 2 — npm transport + grid resource
  downloadGridExport, buildExportColumns
  createGridResource.exportAllMatching / exportSelected
  Replace showcase alert() with real download

PR 3 — UI/PrimeNG toolbar
  export config on grid component
  Toolbar export button + bulk “Export selected”
  Docs: getting-started Export section

PR 4 — future
  Select-all-matching selection + excludedKeys export
  QueryGrid.Export.Excel (ClosedXML) optional package
  GET export for small queries
```

## Open decisions

1. **MaxExportRows** — default 50_000; overridable per endpoint via `GridExportOptions`.
2. **Truncation** — stream partial file + header vs 413 when over cap (recommend: stream + `X-Grid-Export-Truncated`).
3. **ASP.NET package** — ship `QueryGrid.AspNetCore` in v1 or document minimal API sample only (recommend: sample first, package when second consumer exists).
4. **Permissions** — same as list in v1; document pattern for stricter export policies.

## References

- Row selection: [getting-started.md](../getting-started.md#row-selection-and-bulk-actions)
- `GridQuery` transport: [getting-started.md](../getting-started.md#json-shape)
- List pipeline: `GridResultExecutor.Plan`, `ToGridResultAsync`
- Showcase list endpoint: `samples/showcase-api/Program.cs`
