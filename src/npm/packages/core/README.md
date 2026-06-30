# @query-grid/core

Framework-agnostic TypeScript types for [QueryGrid](https://github.com/damianlaczynski/QueryGrid) — `GridQuery`, `GridResult`, filter/sort nodes, and display helpers.

## Install

```powershell
npm install @query-grid/core
```

## Example

```typescript
import type { GridQuery, GridResult } from "@query-grid/core";
import { formatGridError } from "@query-grid/core";

const query: GridQuery = { take: 20, sort: [{ field: "LastActivityAt", desc: true }] };
```

Serialize with `JSON.stringify` in your HTTP layer. This package does not ship transport helpers.

## Full guide

[Getting started](https://github.com/damianlaczynski/QueryGrid/blob/main/docs/getting-started.md) — install, JSON shape, field naming, and Angular integration via `@query-grid/primeng`.
