# Changelog

All notable changes to this project are documented here.

## 0.1.0-preview.3 — 2026-07-18

### Changed

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
