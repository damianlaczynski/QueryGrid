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

### JSON binding (your code)

QueryGrid ships transport **types** and `FilterNodeJsonConverter` — not HTTP helpers. Use `GridQueryJson.CreateOptions()` from `QueryGrid.Abstractions.Serialization` (see `samples/showcase-api/GridQueryBinding.cs`):

```csharp
using QueryGrid.Abstractions.Serialization;

var jsonOptions = GridQueryJson.CreateOptions();
var grid = JsonSerializer.Deserialize<GridQuery>(json, jsonOptions);
```

### FastEndpoints

Name the request property to match the query parameter (camelCase). Register a value parser that uses your JSON options:

```csharp
public sealed class GetIssuesRequest
{
  public GridQuery Grid { get; set; } = new();  // ?grid={json}
  public bool WatchedByMe { get; set; }
}

// At startup:
b.Binding.ValueParserFor<GridQuery>((value) =>
  GridQueryBinding.TryParse(value.ToString(), out var grid)
    ? ParseResult.Success(grid)
    : ParseResult.Failed());
```

`public GridQuery LoadOptions` would bind from `?loadOptions=` when the parser is registered.

Contextual filters (`WatchedByMe`, …) stay as separate query parameters — only column sort/filter/search travels in the grid JSON blob.

### Multi-sort

- **PrimeNG** (`qg-prime-data-grid`): multi-sort is on by default (`sortMode="multiple"`). Click another column header to add a sort level (no Shift). Click again to toggle asc/desc; remove a level via the column menu or **Clear**.

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

@Component({
  /* … */
})
export class IssuesComponent {
  private readonly api = inject(IssuesService);
  private readonly gridFactory = inject(GridResourceFactory);
  private readonly destroyRef = inject(DestroyRef);

  readonly grid = this.gridFactory.create<IssueDto>({
    destroyRef: this.destroyRef,
    load: (q) => this.api.getAllIssues(q),
    defaultSort: [{ field: "LastActivityAt", desc: true }],
    persistState: { key: "my-app.issues-list", storage: "session" },
  });
}
```

Serialize `GridQuery` in your HTTP service with `JSON.stringify` and the same query parameter name as on the server.

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
