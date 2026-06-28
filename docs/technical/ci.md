# Continuous integration

> Scope: GitHub Actions workflow for this repository.
> **Source of truth:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — update this file when CI changes; keep `ci.md` in sync.

## Triggers

Runs on **push** and **pull_request** to `main` or `master`.

Concurrent runs for the same branch are cancelled when a newer commit is pushed.

## Jobs

| Job           | What it runs                                        | Working directory |
| ------------- | --------------------------------------------------- | ----------------- |
| **dotnet**    | `dotnet restore` → `dotnet test` → `dotnet pack`    | Repository root   |
| **npm**       | `npm ci` → `npm run build:npm` → `npm run test:npm` | `src/npm`         |
| **artifacts** | Pack dotnet + build npm, upload combined artifact   | Root + `src/npm`  |

### dotnet

- .NET **10**
- Solution: `src/dotnet/QueryGrid.slnx`
- Release configuration
- Pack output: `artifacts/nuget/*.nupkg`

### npm

- Node.js **24**
- npm cache keyed on `src/npm/package-lock.json`
- Builds `@query-grid/core`, `@query-grid/primeng`
- Runs Vitest in **both** `@query-grid/core` and `@query-grid/primeng`

## Reproduce locally

```powershell
# From repository root
npm run test:all
npm run build:all
npm run lint:npm
npm run pack:dotnet
```

Or run jobs separately:

```powershell
dotnet test src/dotnet/QueryGrid.slnx -c Release
cd src/npm
npm ci
npm run build:npm
npm run test:npm
npm run lint:npm
```

## What CI does not cover

| Check                            | Local command                             |
| -------------------------------- | ----------------------------------------- |
| Sample apps                      | Build and run under `samples/` manually   |
| ESLint (`src/npm`)               | `npm run lint:npm` from repository root   |
| dotnet format                    | `dotnet format src/dotnet/QueryGrid.slnx` |
| Cross-repo consumer verification | Use `samples/` or published packages      |
