# npm Guidelines

> Scope: conventions for implementing work in the `@query-grid/*` npm packages.
>
> Package ownership and folder layout: [repo-map.md](repo-map.md). JSON wire format: [getting-started.md](../getting-started.md).

## Stack summary

TypeScript libraries published via npm workspaces. `@query-grid/core` is framework-agnostic (Vitest). `@query-grid/primeng` is an Angular library built with `ng-packagr`. ESLint and Prettier apply under `src/npm/`.

For build, test, and lint commands, see [`AGENTS.md`](../../AGENTS.md).

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

## What does not belong here

- Sample applications — `samples/`
- Consumer HTTP services — consumer apps pass `load: (q) => ...` into `createGridResource`
