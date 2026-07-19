# Changelog

All notable changes to this project are documented here.

## 0.1.0-preview.7 — 2026-07-19

### Changed

- CI: tag `v*` triggers full publish — NuGet (nuget.org + GitHub Packages) and npm (npmjs.com) via trusted publishing (OIDC)

## 0.1.0-preview.4 — 2026-07-19

### Added

- **QueryGrid.IntegrationTests** — PostgreSQL + Testcontainers coverage for `GridQuery.Search` on projected EF queries with correlated subqueries
- **QueryGrid.Core** — `ApplyEntitySearch` and `GridQuery.WithoutSearch()` for entity-level search before projection

### Fixed

- **QueryGrid.Core / QueryGrid.EntityFrameworkCore** — `GridQuery.Search` on projected `IQueryable` DTOs no longer fails on PostgreSQL when searchable fields include `Guid` (equality instead of `ToString().Contains()`; non-Guid text skips Guid fields)

## 0.1.0-preview.3 — 2026-07-18

### Added

- **@query-grid/ui** — `<qg-ui-data-grid>` adapter on `@laczynski/ui` (column filters with Add Rule, search, chips, multi-sort, persistence)

### Changed

- Multi-sort UX aligned with PrimeNG `sortMode="multiple"`: plain header click replaces with a single column; Ctrl/Cmd + click adds or toggles within multi-sort (`@query-grid/ui`, `@query-grid/primeng`)
- PrimeNG column filters support Match All / Match Any with up to five rules per column
- String filters and global search use `string.ToLower()` instead of `ToLowerInvariant()` so EF Core can translate them to SQL `LOWER` (Npgsql, SQLite, SQL Server)

### Fixed

- **QueryGrid.Core / QueryGrid.EntityFrameworkCore** — `Contains` / `StartsWith` / `EndsWith` / `NotContains` and `[GridSearchable]` search no longer throw `Translation of method 'string.ToLowerInvariant' failed` under relational EF providers

## 0.1.0-preview.1 — 2026-07-01

First public preview.

### Added

- **QueryGrid.Abstractions** — `GridQuery`, `GridResult`, filter/sort types, attributes, `GridValidationException`, `GridQueryJson.CreateOptions()`, `FilterNodeJsonConverter`
- **QueryGrid.Core** — automatic DTO field discovery, filter/sort/search expression building, `ApplyGrid*` extensions, `GridOptions` safety limits, automatic `Id` tie-breaker sort
- **QueryGrid.EntityFrameworkCore** — `ToGridResultAsync`
- **@query-grid/core** — TypeScript models mirroring the transport contract, `formatGridError`, `formatLocalDateTime`
- **@query-grid/primeng** — `createGridResource()` signal store, `<qg-prime-data-grid>` with column filters, global search, multi-sort, and optional `persistState`
- Showcase samples (`showcase-api`, `showcase-ui`), CI workflow, and documentation

### Notes

- JSON/HTTP transport is owned by the host app (serialize `GridQuery` with `GridQueryJson.CreateOptions()` on the server). See `samples/showcase-api/GridQueryBinding.cs` and [getting-started.md](docs/getting-started.md).
- Legacy packages removed before this release (`QueryGrid.AspNetCore`, `@query-grid/angular`, `qgCell`, URL sync in grid resource) — not part of the public API.
