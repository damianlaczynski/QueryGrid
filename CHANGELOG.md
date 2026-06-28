# Changelog

## Unreleased

### Changed

- Removed legacy `@query-grid/angular` package (superseded by `@query-grid/primeng`)
- Removed legacy `qgCell` directive and headless `GRID_TABLE_*` composition exports from `@query-grid/primeng` — use `qgColumn` for column + cell templates
- Renamed `QgCellContext` → `QgColumnContext` in public API
- Split PrimeNG lazy-load bridge into `sort-mapper.ts`, `filter-mapper.ts`, `match-mode-options.ts`
- Added shared `GridQueryJson.CreateOptions()` for JSON transport setup
- Added ESLint + Prettier for `src/npm/` packages
- Removed JSON/HTTP transport from packages — apps own serialize/deserialize and query param names; see `samples/showcase-api/GridQueryBinding.cs`
- Removed `urlSync` from `createGridResource` and `transport.ts` from `@query-grid/core`
- Repository layout: `npm/` → `src/npm/`, `src/QueryGrid.Backend/` → `src/dotnet/` with flattened package folders and `QueryGrid.slnx`
- Root scripts renamed: `build:backend` / `test:backend` → `build:dotnet` / `test:dotnet`
- Added `AGENTS.md`, `docs/guides/`, `docs/technical/`, and `samples/` scaffolding
- Documentation sync for removed legacy APIs (`qgCell`, `@query-grid/angular`, URL sync)

## 0.1.0-preview.1 — 2026-06-24

### Added

- **QueryGrid.Abstractions** — `GridQuery`, `GridResult`, filter/sort types, attributes, `GridValidationException`
- **QueryGrid.Core** — automatic DTO field discovery, filter/sort/search expression building, `ApplyGrid*` extensions, `GridOptions` safety limits, automatic `Id` tie-breaker sort
- **QueryGrid.EntityFrameworkCore** — `ToGridResultAsync`
- **QueryGrid.AspNetCore** — JSON query-string transport, `[GridFromQuery]` model binder, `AddQueryGrid` / `UseQueryGridExceptionHandler`
- **@query-grid/core** — TypeScript models, encode/decode transport, paging helpers
- **@query-grid/angular** — `createGridResource()` signal store with optional URL sync, plus the `<qg-data-grid>` headless data table
- **@query-grid/primeng** — `<qg-prime-data-grid>` PrimeNG lazy table with column header filters, global search and Clear button
- 56 .NET unit tests, 6 npm unit tests, CI workflow
