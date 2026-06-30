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
| **npm**       | `npm ci` → `npm run build:npm` → `npm run test:npm` | Repository root   |
| **artifacts** | Pack dotnet + build npm, upload combined artifact   | Repository root   |

### dotnet

- .NET **10**
- Solution: `src/dotnet/QueryGrid.slnx`
- Release configuration
- Pack output: `artifacts/nuget/*.nupkg`

### npm

- Node.js **24**
- npm cache keyed on `package-lock.json`
- Builds `@query-grid/core`, `@query-grid/primeng`
- Runs Vitest in **both** `@query-grid/core` and `@query-grid/primeng`

## Reproduce locally

Full command list: [`AGENTS.md`](../../AGENTS.md). CI runs the equivalent of `npm run test`, `npm run build`, and `dotnet pack` on every push.

CI-specific differences:

- Uses `npm ci` (not `npm install`) and Node **24**
- Does **not** run `npm run lint` or sample apps — run those locally before a PR

## What CI does not cover

| Check                            | Local command / workflow                                             |
| -------------------------------- | -------------------------------------------------------------------- |
| Sample apps                      | Build and run under `samples/` manually                              |
| ESLint (`src/npm`)               | `npm run lint` from repository root                                  |
| dotnet format                    | `dotnet format src/dotnet/QueryGrid.slnx`                            |
| Cross-repo consumer verification | Use `samples/` or published packages                                 |
| **Publishing**                   | Push a `v*` tag → [publish.yml](../../.github/workflows/publish.yml) |

## Publish workflow

Separate from CI — runs on **tag push** `v*` (e.g. `v0.1.0-preview.2`).

| Step       | Action                                                       |
| ---------- | ------------------------------------------------------------ |
| Trigger    | `git push origin v0.1.0-preview.2`                           |
| Auth       | `GITHUB_TOKEN` with `packages: write`                        |
| NuGet feed | `https://nuget.pkg.github.com/<repository_owner>/`           |
| npm        | **Manual** on npmjs.com — see [publishing.md](publishing.md) |

Details: [publishing.md](publishing.md).
