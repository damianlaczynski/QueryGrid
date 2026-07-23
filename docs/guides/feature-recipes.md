# Feature Recipes

> Short step-by-step guides for common library changes. For conventions, see [dotnet-guidelines.md](dotnet-guidelines.md) and [npm-guidelines.md](npm-guidelines.md).

## Add a filter operator

1. Add enum value to `FilterOperator` in `QueryGrid.Abstractions`.
2. Extend `TypeClassifier` / allowed operators per field category in `QueryGrid.Core`.
3. Implement expression in `FilterExpressionBuilder`.
4. Add cases in `FilterTests` and `ValidationAndLimitsTests`.
5. If the operator appears in column filters, add PrimeNG UI mapping in `filter-mapper.ts` / `match-mode-options.ts`.
6. Run `npm run test:all`.

## Change grid JSON shape

See [Change coupling checklist](../../AGENTS.md#change-coupling-checklist). Steps:

1. Update types in `QueryGrid.Abstractions` and `FilterNodeJsonConverter` if needed.
2. Update `GridQueryContractTests` in `QueryGrid.UnitTests`.
3. Mirror types in `@query-grid/core`.
4. Update `GridQueryJson.CreateOptions()` / `samples/showcase-api/GridQueryBinding.cs` if serializer options change.
5. Run `npm run test:all`.

## Custom sort semantics (enum order, sort key, companions)

1. Add or apply attributes in `QueryGrid.Abstractions`: `GridEnumOrderAttribute`, `GridSortKeyAttribute`, `GridSortWithAttribute`.
2. Extend schema discovery in `GridSchemaProvider` and sorting in `SortExpressionBuilder`.
3. Add unit tests in `SortExtensionTests` and schema tests in `SchemaDiscoveryTests`.
4. Add PostgreSQL integration coverage in `PostgreSqlSortExtensionTests`.
5. Document the grid list-row DTO pattern in [dotnet-guidelines.md](dotnet-guidelines.md).

## Add a grid state field (e.g. new load option)

1. Add property to `GridQuery` (Abstractions + core TS model).
2. Apply in `GridQueryableExtensions` or relevant builder in Core.
3. Extend `createGridResource()` state and load pipeline in `@query-grid/primeng`.
4. Map UI control in `@query-grid/primeng` if user-facing.
5. Update [getting-started.md](../getting-started.md) example payload if user-visible.

## Add row selection or bulk toolbar behavior

1. Extend `@query-grid/core` helpers in `grid-row-selection.ts` if selection rules change.
2. Wire controls in `grid-row-selection-controls.ts` and `createGridResource()` (ui + primeng).
3. Update checkbox column and `[qgBulkToolbar]` in `ui-data-grid` / `prime-data-grid` templates.
4. Require `dataKey` on the grid component; document in [getting-started.md](../getting-started.md).
5. Run `npm run test:npm` and verify in showcase (cross-page selection, sort keeps selection, filter clears).

## Add client persist extra (scroll, layout, …)

1. Add helpers in `@query-grid/core` (`pick*Extra` / `read*Extra`).
2. Add controls module and merge in `createGridResource()` `getExtraState` / `applyExtraState`.
3. Bind DOM state in grid component (`bindHorizontalScrollPersistence` pattern for scroll).
4. Document what is / is not stored in saved views — see [getting-started.md](../getting-started.md#persist-extra-state-summary).
5. Add unit tests for round-trip extra state.

## Add grid export

Server-first CSV export is implemented. See [grid-export-plan.md](grid-export-plan.md).

1. **.NET** — `GridExportRequest`, `ExportToCsvAsync` on `IQueryable` (Core + EF).
2. **npm** — `downloadGridExport` in `@query-grid/core`; `export` on `createGridResource`.
3. **UI** — built-in Export toolbar button; Export selected in bulk toolbar when `rowSelection` is enabled.
4. Document endpoint and column whitelist in [getting-started.md](../getting-started.md#server-export-csv).

## Add a new NuGet integration package

1. Create project under `src/dotnet/QueryGrid.<Name>/`.
2. Add to `QueryGrid.slnx` under `/packages/`.
3. Reference only the minimal existing packages (usually `QueryGrid.Core`).
4. Add `PackageId`, `Description` in `.csproj`; version inherits from `Directory.Build.props`.
5. Add focused unit tests or sample usage in `samples/`.

## Add a new npm package

1. Create `src/npm/packages/<name>/` with `package.json`, `ng-package.json` if Angular library.
2. Register in `src/npm/package.json` workspaces (automatic via `packages/*`).
3. Add `build:<name>` script if not covered by `build:npm`.
4. Export public API from `public-api.ts` or `index.ts`.
5. Document in README and [repo-map.md](repo-map.md).

## Verify end-to-end in samples

1. Build and pack locally: `npm run pack:backend`, `npm run build:npm`.
2. Reference packages from the sample (project reference or `file:` / local feed).
3. Run `npm run start:all`; exercise sort, filter, paging, and search.
4. See [samples/README.md](../../samples/README.md) for the showcase layout and scenario matrix.
