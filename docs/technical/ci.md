# Continuous integration

> Scope: GitHub Actions workflow for this repository.
> **Source of truth:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — update this file when CI changes; keep `ci.md` in sync.

## Triggers

Runs on **push** and **pull_request** to `main` or `master`.

Concurrent runs for the same branch are cancelled when a newer commit is pushed.

## Jobs

| Job        | What it runs                                        | Working directory |
| ---------- | --------------------------------------------------- | ----------------- |
| **dotnet** | `dotnet restore` → `dotnet test`                    | Repository root   |
| **npm**    | `npm ci` → `npm run build:npm` → `npm run test:npm` | Repository root   |

### dotnet

- .NET **10**
- Solution: `src/dotnet/QueryGrid.slnx`
- Release configuration

### npm

- Node.js **24**
- npm cache keyed on `package-lock.json`
- Builds `@query-grid/core`, `@query-grid/primeng`
- Runs Vitest in **both** `@query-grid/core` and `@query-grid/primeng`

## Reproduce locally

Full command list: [`AGENTS.md`](../../AGENTS.md). CI runs the equivalent of `npm run test:all` on every push. Packing and publishing happen only on tag push — see [publishing.md](publishing.md).

CI-specific differences:

- Uses `npm ci` (not `npm install`) and Node **24**
- Does **not** run `npm run lint:frontend` or sample apps — run those locally before a PR

## What CI does not cover

| Check                            | Local command / workflow                                             |
| -------------------------------- | -------------------------------------------------------------------- |
| Sample apps                      | `npm run start:all`                                                  |
| ESLint (`src/npm`)               | `npm run lint:frontend` from repository root                         |
| dotnet format                    | `dotnet format src/dotnet/QueryGrid.slnx`                            |
| Cross-repo consumer verification | Use `samples/` or published packages                                 |
| **Publishing**                   | Push a `v*` tag → [publish.yml](../../.github/workflows/publish.yml) |

## Publish workflow

Separate from CI — runs on **tag push** `v*`. Tests, packs, and publishes NuGet (nuget.org + GitHub Packages), npm (npmjs.com + GitHub Packages), and creates a GitHub Release.

Details: [publishing.md](publishing.md).
