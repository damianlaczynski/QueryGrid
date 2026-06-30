# AI Working Guide

> Scope: fast-start context for AI agents and contributors in **this repository**. Load this file first, then open the focused docs under `docs/` for the area you are changing.

## Repository shape

- `src/dotnet/` — .NET solution (`QueryGrid.slnx`) with NuGet packages (`QueryGrid.*`) and unit tests.
- `src/npm/` — npm workspaces with publishable packages (`@query-grid/*`).
- `samples/` — showcase apps that stress-test data types and grid scenarios (integration verification; not shipped).
- `docs/` — guides and technical docs (`docs/README.md` for the full index).
- `docs/guides/README.md`, `docs/technical/README.md` — entry points per area.
- Root `package.json` — orchestration scripts for dotnet and npm from the repository root.

## Start here by task

- .NET package change: read `docs/guides/README.md`, then `repo-map.md` and `dotnet-guidelines.md`.
- npm package change: read `docs/guides/README.md`, then `repo-map.md` and `npm-guidelines.md`.
- Test work or bugfix verification: read `docs/guides/testing-guidelines.md`.
- Cross-stack transport or API contract: read `dotnet-guidelines.md`, `npm-guidelines.md`, and `testing-guidelines.md`.
- End-to-end verification: read `samples/README.md`, run `npm run start:showcase-api` and `npm run dev:showcase-ui` (or `start:showcase-ui`).
- CI or publishing: read `docs/technical/README.md`, then `ci.md` or `publishing.md`.

## Commands

### Repository root

From the repository root, run `npm install` once after clone or when workspace dependencies change.

- Install: `npm install`
- Build: `npm run build` (or `build:dotnet` / `build:npm` separately)
- Test: `npm run test` (or `test:dotnet` / `test:npm` separately)
- Lint npm packages: `npm run lint`
- Pack NuGet packages: `npm run pack:dotnet` (output: `artifacts/nuget/`)
- Run showcase API: `npm run start:showcase-api` (http://localhost:5180)
- Run showcase UI: `npm run start:showcase-ui` (http://localhost:4200) — run `npm run build:npm` first
- Develop showcase UI with package watch: `npm run dev:showcase-ui`

### .NET (in `src/dotnet`)

- Restore/build solution: `dotnet build QueryGrid.slnx`
- All tests: `dotnet test QueryGrid.slnx`
- Pack: `dotnet pack QueryGrid.slnx -c Release -o ../../artifacts/nuget`

### npm packages (`src/npm/packages/`)

- Build single package: `npm run build -w @query-grid/core` or `npm run build -w @query-grid/primeng`
- Test single package: `npm run test -w @query-grid/core` or `npm run test -w @query-grid/primeng`

## Repo navigation rules

### .NET packages

- `QueryGrid.Abstractions` — transport contracts (`GridQuery`, `GridResult`, filter/sort types, attributes). Zero dependencies; stability anchor.
- `QueryGrid.Core` — engine: schema discovery, expression builders, `IQueryable` extensions. Depends on Abstractions only.
- `QueryGrid.EntityFrameworkCore` — `ToGridResultAsync` for EF Core.
- Unit tests live in `src/dotnet/tests/QueryGrid.UnitTests/` and mirror package boundaries.

### npm packages

- `@query-grid/core` — TypeScript models and helpers (`formatGridError`, `formatLocalDateTime`); no HTTP/JSON transport layer.
- `@query-grid/primeng` — `createGridResource()` signal store + `<qg-prime-data-grid>` PrimeNG table.

Package source lives under `src/npm/packages/<name>/src/`. Public API is exported from `public-api.ts` (Angular/PrimeNG) or `index.ts` (core).

## Change coupling checklist

- If you change `GridQuery` / `GridResult` or filter/sort JSON shape, update **both** `QueryGrid.Abstractions` and `@query-grid/core`, plus `GridQueryContractTests`.
- If you add or change an operator or field-type rule, update `QueryGrid.Core` expression builders and unit tests; check whether `@query-grid/primeng` filter UI needs a matching control.
- If you change Angular grid state or persistence (`persistState`), update `@query-grid/primeng` and verify in `samples/showcase-ui`.
- Keep package versions in sync across NuGet (`Directory.Build.props`) and npm (`package.json` per package) when releasing.

## Working agreements

- Follow the current package layout instead of inventing a new layer or folder layout.
- Prefer extending an existing package over creating a parallel pattern.
- Verify cross-stack changes in `samples/`, not in downstream consumer repos.
- Keep docs current when introducing a new enforced convention.
- Do not assume files visible in the IDE are committed; verify against the filesystem first.
