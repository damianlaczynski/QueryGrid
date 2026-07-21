# Testing Guidelines

> Scope: which layer owns what, anti-patterns, and what to run before a PR.
>
> Commands and CI: [`AGENTS.md`](../../AGENTS.md), [`docs/technical/ci.md`](../technical/ci.md), [repo-map.md](repo-map.md).

## Core rule

**Default: add tests at the lowest layer that can prove the behavior.**

- Pure logic and JSON contract → unit tests in the owning package.
- Cross-package contract → tests on both sides (dotnet + `@query-grid/core`).
- UI integration and real HTTP round-trip → `samples/` (not unit tests in library packages).

## Layer ownership

| Layer                                           | Owns                                                                                                                    | Does not own                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| .NET unit (`QueryGrid.UnitTests`)               | Expression building, schema discovery, operator validation, JSON contract (`GridQueryContractTests`)                    | Browser, Angular, real HTTP servers                |
| .NET integration (`QueryGrid.IntegrationTests`) | SQLite (in-memory), PostgreSQL, SQL Server via Testcontainers — shared `GridBehaviorScenarios` for provider-agnostic UX | Browser, Angular, real HTTP servers                |
| npm unit (`@query-grid/core` Vitest)            | Model helpers, error codes, formatting                                                                                  | DOM, Angular change detection, JSON transport      |
| npm unit (`@query-grid/primeng`)                | Lazy-load mapping, filter chips                                                                                         | Full browser E2E                                   |
| Samples                                         | Full stack: API + grid UI + real lazy load                                                                              | Exhaustive operator matrix (covered by unit tests) |

## Anti-patterns

**Do not** add tests when:

| Layer     | Skip                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| .NET unit | Behavior is only observable through a sample HTTP server with no new expression logic                      |
| npm unit  | Trivial type re-exports; Angular template markup without logic                                             |
| Samples   | Replacing unit tests for every filter operator — keep matrices in `FilterTests` / `GridQueryContractTests` |

**Do** add or extend tests when:

- Adding a filter operator or changing operator/type rules
- Changing `GridQuery` / `GridResult` JSON shape (`GridQueryContractTests`)
- Changing sort tie-breaker or paging edge cases
- Changing PrimeNG ↔ QueryGrid lazy-load mapping (`lazy-load-mapper.spec.ts`, `filter-mapper-ux.spec.ts`)
- User-visible grid behavior that must work the same on every relational provider (`GridBehaviorScenarios` + per-provider test classes)

## What to run

Prefer the smallest relevant check. Command details: [`AGENTS.md`](../../AGENTS.md).

| Change                                 | Run                                                                  |
| -------------------------------------- | -------------------------------------------------------------------- |
| `QueryGrid.Core` only                  | `npm run test:backend` (or `dotnet test` filtered if fast iteration) |
| `QueryGrid.Abstractions` JSON contract | `dotnet test`                                                        |
| `@query-grid/core`                     | `npm run test:npm` (or test core workspace only from `src/npm`)      |
| `@query-grid/primeng`                  | `npm run test:npm` + `samples/showcase-ui` smoke                     |
| Before PR                              | `npm run test:all`, `npm run build:all`, `npm run lint:frontend`     |

CI runs the equivalent on every push — see [ci.md](../technical/ci.md). ESLint is local/PR checklist only (not in CI yet).

## Test file locations

- .NET: `src/dotnet/tests/QueryGrid.UnitTests/*.cs`
- .NET integration (SQLite + Docker PostgreSQL/SQL Server): `src/dotnet/tests/QueryGrid.IntegrationTests/*.cs`
  - Shared scenarios: `GridBehaviorScenarios.cs`
  - Provider runners: `SqliteGridBehaviorTests`, `PostgreSqlGridBehaviorTests`, `SqlServerGridBehaviorTests`
- npm core: `src/npm/packages/core/src/*.spec.ts`
- npm primeng: `src/npm/packages/primeng/src/*.spec.ts` (include `filter-mapper-ux.spec.ts` for defensive UI mapping)

Colocate new tests with the feature they cover; extend existing test classes before adding parallel files.
