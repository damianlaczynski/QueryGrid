# Repository Map

> Scope: where things live and which package owns what. This is the quickest orientation document after `AGENTS.md`.

## Top level

- Root `package.json` defines orchestration scripts (`build:*`, `test:*`, `pack:dotnet`, `install:npm`) so you can run common dotnet and npm tasks from the repository root.
- `src/dotnet/` contains the .NET solution and publishable NuGet packages.
- `src/npm/` contains the npm workspace and publishable `@query-grid/*` packages.
- `samples/` contains runnable demo applications that reference the library packages (local path or published versions).
- `docs/` contains implementation guides and technical documentation.
- `artifacts/` is the default output folder for packed NuGet packages (gitignored).

## .NET map

### Solution shape

- `src/dotnet/QueryGrid.slnx` is the solution entry point.
- `Directory.Packages.props` manages NuGet package versions centrally.
- `Directory.Build.props` applies shared metadata and version to packable projects.

### Package responsibilities

| Package                         | Owns                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `QueryGrid.Abstractions`        | `GridQuery`, `GridResult`, filter/sort types, attributes, `GridQueryJson`, `FilterNodeJsonConverter`                    |
| `QueryGrid.Core`                | Schema discovery (`GridSchemaProvider`), filter/sort/search expression builders, `IQueryable` extensions, `GridOptions` |
| `QueryGrid.EntityFrameworkCore` | `ToGridResultAsync` — async count, sort, filter, page via EF Core                                                       |

### Internal layout (Core)

- `Schema/` — field discovery and `GridFieldInfo`
- `Internal/` — expression builders, type classification, value conversion (not public API)

### Tests

- `src/dotnet/tests/QueryGrid.UnitTests/` — xUnit tests colocated by concern (`FilterTests`, `SortAndPagingTests`, `GridQueryContractTests`, etc.)
- Uses EF Core InMemory for integration-style tests without a real database.

## npm map

### Workspace shape

- `src/npm/package.json` defines workspaces over `packages/*`.
- Each package has its own `package.json`, build config, and `src/` folder.

### Package responsibilities

| Package               | Owns                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `@query-grid/core`    | TypeScript models mirroring `GridQuery` / `GridResult`, `formatGridError`, `formatLocalDateTime`                       |
| `@query-grid/primeng` | `createGridResource()`, `GridResourceFactory`, `<qg-prime-data-grid>`, `qgColumn` / `qgEmpty` directives, filter chips |

### PrimeNG package layout

- `create-grid-resource.ts`, `grid-resource-factory.ts` — signal-based grid state store
- `grid-state-storage.ts` — optional session / local persistence (`persistState`)
- `table/` — `qgColumn`, `qgEmpty`, column filter component, column resolution
- `sort-mapper.ts`, `filter-mapper.ts`, `match-mode-options.ts`, `lazy-load-mapper.ts` — PrimeNG lazy-load bridge (barrel re-exports from the first three)
- `filter-chips.ts` — filter chip UX

### Tests

- `@query-grid/core` — Vitest (`models.spec.ts`, `grid-error-codes.spec.ts`, `format-local-datetime.spec.ts`).
- `@query-grid/primeng` — Vitest (`lazy-load-mapper.spec.ts`, `filter-chips.spec.ts`); integration via `samples/showcase-ui`.

## Samples map

- `samples/README.md` describes the **showcase** apps (`showcase-api`, `showcase-ui`) — a compatibility matrix for data types, operators, and grid scenarios (not a business-domain demo).
- Samples consume published or locally packed packages — they are **not** part of the library API surface.
- Use samples instead of downstream consumer repos for manual end-to-end verification before release.

## Dependency graph

```
QueryGrid.Abstractions
        │
        ├── QueryGrid.Core
        │         └── QueryGrid.EntityFrameworkCore
        │
@query-grid/core
        │
        └── @query-grid/primeng
```

Transport contracts must stay aligned between `QueryGrid.Abstractions` and `@query-grid/core`.
