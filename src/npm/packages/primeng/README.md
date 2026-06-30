# @query-grid/primeng

PrimeNG lazy data grid for [QueryGrid](https://github.com/damianlaczynski/query-grid) — column filters, global search, multi-sort, and optional session persistence.

## Install

```powershell
npm install @query-grid/core @query-grid/primeng primeng
```

Peer dependencies: Angular 21+, PrimeNG 21+, RxJS 7+.

## Example

```typescript
import { GridResourceFactory } from "@query-grid/primeng";

readonly grid = this.gridFactory.create<IssueDto>({
  destroyRef: this.destroyRef,
  load: (q) => this.api.getAllIssues(q),
  defaultSort: [{ field: "LastActivityAt", desc: true }],
});
```

```html
<qg-prime-data-grid [grid]="grid" dataKey="id">
  <ng-template qgColumn="Title" header="Title" let-row>{{ row.title }}</ng-template>
</qg-prime-data-grid>
```

## Full guide

[Getting started](https://github.com/damianlaczynski/query-grid/blob/main/docs/getting-started.md) — backend setup, JSON transport, column templates, and field naming.
