# npm Guidelines

> Scope: conventions for implementing work in the `@query-grid/*` npm packages.

## Stack summary

TypeScript libraries published via npm workspaces. `@query-grid/core` is framework-agnostic (Vitest). `@query-grid/primeng` is an Angular library built with `ng-packagr`. ESLint and Prettier apply under `src/npm/`.

For build, test, and lint commands, see `AGENTS.md`.

## Package ownership

### @query-grid/core

- Owns TypeScript types mirroring `GridQuery`, `GridResult`, filter/sort nodes.

- Owns display helpers: `formatGridError`, `formatLocalDateTime`, `grid-error-codes`.

- Must not import Angular, PrimeNG, or HTTP clients.

- Does **not** ship JSON/HTTP transport helpers — apps use `JSON.stringify` / `JSON.parse`.

- Unit tests use Vitest (`*.spec.ts` next to source).

### @query-grid/primeng

- Owns `createGridResource()` — signal-based store for grid state (sort, filter, paging, search, loading).

- Owns `<qg-prime-data-grid>` wrapping PrimeNG `p-table`.

- Owns `QgColumnDirective` (`qgColumn`), `QgEmptyDirective` (`qgEmpty`), column filter UI, filter chips, toolbar slot.

- Optional `persistState` — session/local storage via `grid-state-storage.ts` (not URL sync).

- Peer dependencies: `@query-grid/core`, `primeng`, `@angular/*`, `rxjs`.

- PrimeNG lazy-load bridge: `sort-mapper.ts`, `filter-mapper.ts`, `match-mode-options.ts`, re-exported from `lazy-load-mapper.ts` — do not leak PrimeNG types into `@query-grid/core`.

- `createGridResource()` requires `injector: inject(EnvironmentInjector)` when not using `GridResourceFactory`.

## Standard path for a new capability

1. If shared contract changes, update `@query-grid/core` types first.

2. Implement Angular state or PrimeNG UI in `@query-grid/primeng`.

3. Add Vitest tests in the owning package; use `samples/showcase-ui` for component integration.

4. Bump package version in `package.json` when releasing (keep aligned with NuGet preview version).

## Angular library conventions

- Standalone components and directives.

- Use signals for grid resource state — avoid mutable class fields for load state.

- Create grids via `inject(GridResourceFactory)` or `createGridResource({ injector, load, … })`.

- Column + cell templates: `qgColumn` only (declares field, header, filter, and cell body in one template).

- Optional empty state: `qgEmpty` projected into `<qg-prime-data-grid>`.

- Do not embed app-specific routes, auth, or API base URLs — consumers pass a `load` function.

## JSON contract alignment

The grid query JSON must match `FilterNodeJsonConverter` on the server:

- camelCase property names on `GridQuery` itself (`take`, `sort`, `filter`)

- sort/filter **field** values match server DTO property names (typically PascalCase)

- string enum values for operators and filter logic

- plain JSON (not base64)

On .NET, use `GridQueryJson.CreateOptions()` for deserialize. Query parameter **names** and HTTP wiring live in the host app — see `samples/showcase-api/GridQueryBinding.cs` and `samples/showcase-ui/`.

When changing JSON shape, update `@query-grid/core` models and `GridQueryContractTests.cs` together.

## What does not belong here

- Sample applications — `samples/`

- Consumer HTTP services — consumer apps pass `load: (q) => ...` into `createGridResource`
