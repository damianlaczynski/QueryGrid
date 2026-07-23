# Getting started

## Install

### .NET

```powershell
dotnet add package QueryGrid.EntityFrameworkCore
```

### npm

```powershell
npm install @query-grid/core @query-grid/primeng primeng
```

## Backend

1. Define a list DTO — public properties become sortable/filterable automatically.
2. Call `ToGridResultAsync` on the projected `IQueryable`.
3. Deserialize `GridQuery` from a query parameter in **your** API layer (JSON shape below).

```csharp
public sealed class IssueDto
{
  public Guid Id { get; init; }
  public string Title { get; init; } = "";
  public IssueStatus Status { get; init; }
}

var grid = await db.Issues.AsNoTracking()
  .Select(i => new IssueDto { Id = i.Id, Title = i.Title, Status = i.Status })
  .ToGridResultAsync(request.Grid, cancellationToken: ct);
```

### Search on projected queries

`GridQuery.Search` works on projected `IQueryable` DTOs, including typical EF Core projections with correlated subqueries (counts, lookups). Mark searchable fields with `[GridSearchable]` on the DTO.

- **String fields** — case-insensitive contains (`ToLower().Contains()`, translated to `LOWER(...) LIKE` by every relational provider).
- **Guid fields** — full `Guid` equality when the search text parses as a `Guid`; otherwise case-insensitive substring match on the canonical string form when the text looks like a Guid fragment (hex digits, dashes, optional braces). Plain text such as `login` does not search Guid fields.

For very heavy projections where provider translation still fails, apply search on the entity **before** `.Select()` and clear search from the grid query:

```csharp
var grid = request.Grid;
var projected = db.Roles.AsNoTracking()
  .ApplyEntitySearch(grid.Search, r => r.Name, r => r.Description)
  .Select(r => new RoleListItemDto { /* … */ });

return await projected.ToGridResultAsync(grid.WithoutSearch(), cancellationToken: ct);
```

### JSON binding (your code)

QueryGrid ships transport **types** and `FilterNodeJsonConverter` — not HTTP helpers. Use `GridQueryJson.CreateOptions()` from `QueryGrid.Abstractions.Serialization` (see `samples/showcase-api/GridQueryBinding.cs`):

```csharp
using QueryGrid.Abstractions.Serialization;

var jsonOptions = GridQueryJson.CreateOptions();
var grid = JsonSerializer.Deserialize<GridQuery>(json, jsonOptions);
```

Contextual filters (`WatchedByMe`, …) stay as separate query parameters — only column sort/filter/search travels in the grid JSON blob.

### GridResult.Sort vs GridQuery.Sort

|                  | `GridQuery.sort` (request)   | `GridResult.sort` (response)                           |
| ---------------- | ---------------------------- | ------------------------------------------------------ |
| **Who sets it**  | Client (UI)                  | Server                                                 |
| **Contents**     | Only what the user asked for | Full order applied in SQL/`IQueryable`                 |
| **Tie-breakers** | Not included                 | May append implicit keys (e.g. `Id`) for stable paging |

If you sort by `Age` only, the request might be `[{ "field": "Age", "desc": false }]`, but the response can echo `[{ "field": "Age", "desc": false }, { "field": "Id", "desc": false }]` when the engine adds an `Id` tie-breaker.

## Frontend

Create a grid resource with `GridResourceFactory` (DI-friendly) or `createGridResource()` directly:

```typescript
import { Component, DestroyRef, inject } from "@angular/core";
import { GridResourceFactory } from "@query-grid/primeng";

@Component({/* … */})
export class IssuesComponent {
  private readonly api = inject(IssuesService);
  private readonly gridFactory = inject(GridResourceFactory);
  private readonly destroyRef = inject(DestroyRef);

  readonly grid = this.gridFactory.create<IssueDto>({
    destroyRef: this.destroyRef,
    load: (q) => this.api.getAllIssues(q),
    defaultSort: [{ field: "LastActivityAt", desc: true }],
    persistState: { key: "my-app.issues-list", storage: "session" },
    syncRoute: true,
  });
}
```

Serialize `GridQuery` in your HTTP service with `JSON.stringify` and the same query parameter name as on the server.

### URL state

Enable `syncRoute` to mirror shareable grid fields (`sort`, `filter`, `search`, `take`) in the router query string under `?grid=` — the same JSON shape as the backend transport. Page offset (`skip`) is omitted by default so links open on page 1.

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  // …
  syncRoute: { param: "grid", debounceMs: 300 },
});
```

Priority on load: **URL → `persistState` → defaults**. When the grid returns to its default sort/filter/search, the `grid` param is removed from the URL.

Build a shareable link manually with `@query-grid/core`:

```typescript
import { buildGridQueryUrl } from "@query-grid/core";

const url = buildGridQueryUrl(location.href, grid.query());
```

### Saved views

Enable `views` to store named presets in `localStorage` (built-in presets from code plus user-saved views):

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  // …
  views: {
    storageKey: "my-app.issues",
    builtins: [
      {
        id: "open",
        name: "Open",
        builtin: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        query: {
          filter: { field: "Status", operator: "eq", value: "Open" },
        },
      },
    ],
  },
});
```

Use `<qg-grid-views [grid]="grid" />` for a preset picker with **Save as**, **Update view** (when modified), and **Delete** actions. When `views` is configured, the picker is also rendered automatically in `<qg-prime-data-grid>` / `<qg-ui-data-grid>` toolbars.

### Column chooser

Enable `columnChooser` to let users show or hide columns client-side. Visibility is stored in `persistState` **extra** (not in `GridQuery`) and is included automatically when saving views:

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  // …
  columnChooser: true,
  persistState: { key: "my-app.issues", storage: "session" },
  views: { storageKey: "my-app.issues" },
});
```

The column picker appears in the grid toolbar when `columnChooser` is enabled. Use `[hideable]="false"` on a `qgColumn` (or `hideable: false` in `[columns]`) to keep fixed columns such as actions out of the picker.

```html
<ng-template
  qgColumn="actions"
  header=""
  [hideable]="false"
  [sortable]="false"
  let-row
>
  …
</ng-template>
```

Use `<qg-grid-column-chooser [grid]="grid" [columns]="columns" />` if you build a custom toolbar.

### Column layout (resize, reorder, pin)

Enable `columnLayout` for client-side column width, order, and pin state in persist **extra** (composes with `columnChooser` and saved views):

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  // …
  columnChooser: true,
  columnLayout: true,
  persistState: { key: "my-app.issues", storage: "session" },
});
```

- **Resize** — drag the handle on the column border
- **Reorder** — drag the grip icon in the header
- **Pin** — click the pin icon in the header (cycles left → right → none)

Use `[reorderable]="false"`, `[resizable]="false"`, or `[pinnable]="false"` on fixed columns. The column chooser footer offers **Reset layout** when widths or pins differ from defaults.

### Row selection and bulk actions

Enable `rowSelection` for a checkbox column and cross-page selection keyed by `dataKey` on the grid component:

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  // …
  rowSelection: true, // or { mode: "single" }
});
```

```html
<qg-prime-data-grid [grid]="grid" dataKey="id">
  <ng-template qgBulkToolbar>
    <p-button label="Delete selected" (onClick)="deleteSelected()" />
  </ng-template>
  <!-- qgColumn templates … -->
</qg-prime-data-grid>
```

`qg-ui-data-grid` uses the same `qgBulkToolbar` slot and `dataKey` input.

**Behavior:**

- Selection is stored as `Set<string>` row keys in memory — **not** in `GridQuery`, `persistState`, or saved views.
- **Multiple** mode (default): checkboxes on each row; header checkbox selects the current page; selection survives paging.
- **Single** mode: one row at a time (`rowSelection: { mode: "single" }`).
- Selection clears on filter, search, page size, and page changes. It is **kept** on sort-only changes.
- `grid.selectedKeys()`, `grid.selectedCount()`, `grid.clearRowSelection()`, and related helpers are available when `rowSelection` is enabled.

Wire bulk actions in your component:

```typescript
import { hasRowSelection } from "@query-grid/primeng";

deleteSelected(): void {
  if (!hasRowSelection(this.grid)) {
    return;
  }

  const keys = [...this.grid.selectedKeys()];
  // call API with keys …
}
```

### Server export (CSV and Excel)

Export uses the **same filter, search, and sort** as the grid list, applied on the server. Configure `export` on `createGridResource` and add a matching API endpoint (see [grid-export-plan.md](guides/grid-export-plan.md)).

```typescript
readonly grid = this.gridFactory.create<IssueDto>({
  load: (query) => this.api.getIssues(query),
  rowSelection: true,
  columnChooser: true,
  export: {
    url: "/api/issues/export",
    dataKeyField: "id",
    defaultFilename: "issues",
    columns: [
      { field: "Id", header: "ID" },
      { field: "Title", header: "Title" },
    ],
  },
});
```

When `export` is set, the grid toolbar shows **Export CSV** and **Export Excel**. With `rowSelection`, the bulk toolbar adds selected-row export for both formats.

```typescript
import { hasExport } from "@query-grid/primeng";

if (hasExport(this.grid)) {
  await this.grid.exportAllMatching({ format: "xlsx" });
  await this.grid.exportSelected({ format: "csv" });
}
```

**.NET** — CSV via `QueryGrid.EntityFrameworkCore`; Excel via optional `QueryGrid.Export.Excel` (ClosedXML):

```csharp
// NuGet: QueryGrid.Export.Excel
await db.Issues.ProjectToDto().ExportToXlsxAsync(request, stream, cancellationToken: ct);
```

Set `GridExportRequest.Format` to `GridExportFormat.Xlsx` or `Csv`. Showcase: `POST /rows/export` with `"format": "xlsx"` in the JSON body.

### Horizontal scroll (session)

When `persistState` is enabled, horizontal scroll position is stored automatically in session **extra** under `scroll.left` (not in `GridQuery` or saved views):

```json
{
  "extra": {
    "scroll": { "left": 240 },
    "columnLayout": { "…": "…" }
  }
}
```

- Restored after reload and after data/layout changes (including when a saved view is active).
- Cleared by **Clear** (toolbar) and **Reset layout** (column chooser).
- Switching saved views resets scroll to the left edge.
- Scroll the **table body** (scrollbar under headers), then wait briefly (~200 ms) before reloading so the debounced save can run.

Requires horizontal overflow (wide columns, many visible columns, or pinned layout).

### Persist extra state summary

| State             | Storage       | In `GridQuery` | In saved views |
| ----------------- | ------------- | -------------- | -------------- |
| Sort/filter/page  | session + URL | yes            | yes (`query`)  |
| Column visibility | session extra | no             | yes (`extra`)  |
| Column layout     | session extra | no             | yes (`extra`)  |
| Horizontal scroll | session extra | no             | no             |
| Row selection     | memory only   | no             | no             |

Declare columns with `qgColumn` — each template defines header, filters, and cell content:

```html
<qg-prime-data-grid [grid]="grid" dataKey="id" searchPlaceholder="Search…">
  <ng-template
    qgColumn="Title"
    header="Title"
    [filter]="{ type: 'text', placeholder: 'Contains…' }"
    [qgColumnOf]="rowType"
    let-row
  >
    {{ row.title }}
  </ng-template>
</qg-prime-data-grid>
```

```typescript
/** Type anchor for strict `let-row` typing — `[qgColumnOf]="rowType"`. */
protected readonly rowType!: IssueDto;
```

### Multi-sort

`qg-prime-data-grid` and `qg-ui-data-grid` use the same multi-sort UX: a plain header click sorts a single column (replaces previous sorts); **Ctrl/Cmd + click** adds or toggles a column within multi-sort. Clear via **Clear**.

### Field naming

| Context                                      | Convention                                                  | Example                                   |
| -------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `sort` / `filter` field names in `GridQuery` | Match **server DTO property names** (PascalCase by default) | `{ "field": "LastActivityAt" }`           |
| JSON property names on the wire              | camelCase (`PropertyNamingPolicy.CamelCase`)                | `"lastActivityAt"` in serialized DTO rows |
| Row properties in Angular templates          | Usually camelCase (API JSON)                                | `row.title` for `Title`                   |

Use PascalCase in `qgColumn="Title"` and `defaultSort` field names; use camelCase when reading row values from JSON responses.

## JSON shape

Pick a query parameter name in your API (e.g. property `Grid` → `?grid=`). Value is plain JSON (URL-encoded):

```
GET /issues?grid=%7B%22take%22%3A20%2C%22sort%22%3A%5B%7B%22field%22%3A%22LastActivityAt%22%2C%22desc%22%3Atrue%7D%5D%7D
```

Decoded payload (camelCase property names, PascalCase **field** values inside sort/filter, string enum operators):

```json
{
  "take": 20,
  "sort": [{ "field": "LastActivityAt", "desc": true }]
}
```

Filter trees use `FilterNodeJsonConverter` on .NET — see `GridQueryContractTests` for the expected shape.

## Safety limits (defaults)

| Limit                      | Default |
| -------------------------- | ------- |
| Max page size (`take`)     | 100     |
| Default page size          | 20      |
| Filter tree depth          | 5       |
| Total filter conditions    | 50      |
| `in` / `notIn` list length | 200     |
| Sort descriptors           | 5       |

Override via `GridOptions` on the server or `maxTake` / `defaultTake` in `createGridResource`.

## Optional integrations

### FastEndpoints

Name the request property to match the query parameter (camelCase). `GridQuery.TryParse` is picked up automatically — no startup registration:

```csharp
public sealed class GetAllIssuesQuery
{
  public GridQuery Grid { get; set; } = new();  // ?grid={json}
  public bool WatchedByMe { get; set; }
}
```

`public GridQuery LoadOptions` binds from `?loadOptions=` the same way.
