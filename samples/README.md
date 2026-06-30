# Samples

> Runnable applications that stress-test QueryGrid across data types, operators, and UI scenarios. Use these for end-to-end verification instead of downstream consumer repositories.

## Purpose

Samples are a **living compatibility matrix**, not a demo of a business domain (no Issues, Users, or similar app features).

Goals:

- Exercise **every supported CLR / TypeScript field category** with real grid columns.
- Exercise **every filter operator** allowed per type through the UI and API.
- Cover **edge cases** that unit tests alone miss: URL-encoded transport, lazy reload, multi-sort, nested `and`/`or` filters, empty results, max `take`, invalid operator rejection.
- Manual QA before publishing and a reference for integrators building complex grids.

Samples are **not** published and **not** part of the library API.

## Layout

```
samples/
  showcase-api/     # ASP.NET API + EF Core, seeded with diverse row shapes
  showcase-ui/      # Angular + @query-grid/primeng — one screen, many column types
```

`GET /rows` returns rows from **ShowcaseRowDto** — a DTO designed only to expose grid behaviour.

## Showcase DTO — data type coverage

The seed model includes at least one column per category the engine discovers:

| Column / property kind                   | Exercises                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `string` (short text)                    | `contains`, `notContains`, `startsWith`, `endsWith`, `eq`, `ne`, global search |
| `string?` (nullable)                     | `isNull`, `isNotNull`, text operators                                          |
| `int`, `long`, `decimal`, `double`       | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`                                |
| `bool`                                   | `eq`                                                                           |
| `DateTime`, `DateTimeOffset`, `DateOnly` | comparisons, `between`, timezone display in UI                                 |
| `enum`                                   | `eq`, `ne`, `in`, `notIn`                                                      |
| `Guid`                                   | `eq`, `ne`                                                                     |
| `[GridIgnore]` property                  | absent from schema — verify not sortable/filterable                            |
| `[GridSort(false)]`                      | filterable but not sortable                                                    |
| `[GridFilter(false)]`                    | sortable but not filterable                                                    |
| Computed / display-only (if exposed)     | opt-out attributes                                                             |

300 seeded rows so paging, sort stability (including `Id` tie-breaker), and filter narrowing are observable.

## Scenario coverage (API + UI)

| Scenario               | What to verify                                                    |
| ---------------------- | ----------------------------------------------------------------- |
| Default load           | `take` default, first page, total count                           |
| Single-column sort     | asc/desc per type                                                 |
| Multi-sort             | up to `GridOptions` sort limit, order preserved                   |
| Column filter per type | correct PrimeNG control → operator → API round-trip               |
| Combined filters       | `and` / `or` groups (when UI exposes them)                        |
| Global search          | `search` across string fields                                     |
| Paging                 | skip/take, last page, empty page after filter                     |
| Session persist        | `persistState` — refresh restores grid state from session storage |
| Validation errors      | invalid operator for type → ProblemDetails / grid error state     |
| Clear / reset          | toolbar clears filters and reloads                                |
| Large `in` list        | boundary below `GridOptions` limit                                |

Unit tests in `src/dotnet` prove expression correctness; samples prove **wiring** end-to-end.

## Local workflow

1. Install and build from repo root:

   ```powershell
   npm install
   npm run build
   ```

2. During development, `samples/showcase-ui` resolves `@query-grid/*` via the root npm workspace (symlinks — no manual sync).

3. Start API and UI; walk the scenario matrix above before a release.

## What belongs in samples vs library

| Concern                                | Library (`src/`)      | Samples                   |
| -------------------------------------- | --------------------- | ------------------------- |
| Operators, schema rules, JSON contract | Yes (+ unit tests)    | Exercise via HTTP/UI only |
| Rich seed data and showcase DTO        | No                    | Yes                       |
| DbContext, migrations, seed script     | No                    | Yes                       |
| Exhaustive operator matrix tests       | `QueryGrid.UnitTests` | Smoke + manual checklist  |
| Auth, routing, theming                 | No                    | Minimal shell only        |

## Status

- **showcase-api** — `GET /rows`, 300 seeded rows, full `ShowcaseRowDto` type matrix. Run: `npm run start:showcase-api` (http://localhost:5180).
- **showcase-ui** — Angular + `@query-grid/primeng` grid with a `qgColumn` per DTO field (except `[GridIgnore]`). Proxies API to :5180.

## Quick start (full stack)

```powershell
# Terminal 1 — API
npm run start:showcase-api

# Terminal 2 — UI (build packages first if not done yet)
npm run build:npm
npm run start:showcase-ui
```

## Development with package watch

From the repository root, rebuild and sync `@query-grid/*` into the UI sample while editing library code:

```powershell
npm run dev:showcase-ui
```

This runs `watch:core`, `watch:primeng`, and the Angular dev server together.
