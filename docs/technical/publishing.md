# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.
>
> **Primary registry:** [GitHub Packages](https://github.com/damianlaczynski/QueryGrid/packages) — tied to this repository. Push a `v*` tag to publish via [`.github/workflows/publish.yml`](../../.github/workflows/publish.yml).

## Registries

| Package                         | GitHub Packages (repo-linked) | Public mirror (optional) |
| ------------------------------- | ----------------------------- | ------------------------ |
| `QueryGrid.Abstractions`        | `nuget.pkg.github.com`        | nuget.org                |
| `QueryGrid.Core`                | `nuget.pkg.github.com`        | nuget.org                |
| `QueryGrid.EntityFrameworkCore` | `nuget.pkg.github.com`        | nuget.org                |
| `@query-grid/core`              | `npm.pkg.github.com`          | npmjs.com                |
| `@query-grid/primeng`           | `npm.pkg.github.com`          | npmjs.com                |

`RepositoryUrl` in `Directory.Build.props` and `repository` in npm `package.json` link packages to **this repo** — GitHub inherits permissions from the repository on first publish.

### npm scope and GitHub owner

GitHub npm requires the scope in `package.json` to match the **publishing account** (user or org). Our packages use `@query-grid/*`.

| Repository owner   | npm on GitHub Packages                      |
| ------------------ | ------------------------------------------- |
| `damianlaczynski`  | NuGet works; npm needs org **`query-grid`** |
| `query-grid` (org) | NuGet + npm both work with `@query-grid/*`  |

**Recommendation:** create a GitHub organization [`query-grid`](https://github.com/organizations/plan) (lowercase) and transfer (or fork) this repository there. Then `@query-grid/*` publishes without renaming packages.

Until then: use GitHub Packages for **NuGet**; publish **npm** to [npmjs.com](https://www.npmjs.com) manually (`publishConfig.registry` → `https://registry.npmjs.org`, `--access public`).

## Where versions live

| Stack           | Location                                                       |
| --------------- | -------------------------------------------------------------- |
| NuGet (shared)  | `src/dotnet/Directory.Build.props` → `<Version>`               |
| npm per package | `src/npm/packages/*/package.json` → `"version"`                |
| primeng peer    | `peerDependencies["@query-grid/core"]` must match core version |

## Release (GitHub Packages — automated)

1. Bump versions in `Directory.Build.props` and npm `package.json` files.
2. Update `CHANGELOG.md`.
3. From repo root, verify locally:

   ```powershell
   npm run test
   npm run build
   npm run lint
   npm run pack:dotnet
   npm run pack:npm
   ```

4. Commit, tag, and push — **publish workflow runs on the tag**:

   ```powershell
   git tag v0.1.0-preview.2
   git push origin v0.1.0-preview.2
   ```

The [publish workflow](../../.github/workflows/publish.yml):

- Runs tests + lint
- Packs NuGet → pushes to `https://nuget.pkg.github.com/<owner>/index.json`
- Builds npm → pushes `@query-grid/core` then `@query-grid/primeng` to `npm.pkg.github.com`
- Uses `GITHUB_TOKEN` (`packages: write`) — no PAT in the workflow
- Prerelease versions (`preview`, `alpha`, `beta`, `rc`) get npm dist-tag **`preview`**; stable → **`latest`**

Create a GitHub Release from the tag and paste the matching `CHANGELOG.md` section.

## Consumer setup

### NuGet (GitHub Packages)

Copy [`nuget.config.example`](nuget.config.example) into your app as `nuget.config`. Replace `OWNER` with the repository owner (`damianlaczynski` or `query-grid`).

Authenticate locally with a PAT (`read:packages`):

```powershell
dotnet nuget add source --username YOUR_GITHUB_USERNAME --password YOUR_PAT --store-password-in-clear-text --name github "https://nuget.pkg.github.com/OWNER/index.json"
dotnet add package QueryGrid.EntityFrameworkCore --version 0.1.0-preview.2
```

In **GitHub Actions** on the consuming repo, use `GITHUB_TOKEN` with read access to the package (inherit from linked repo or grant workflow access in package settings).

`packageSourceMapping` in the example routes only `QueryGrid.*` to GitHub — everything else stays on nuget.org (avoids intermittent 403 on public restores).

### npm (GitHub Packages)

Copy [`npmrc.consumer.example`](npmrc.consumer.example) into your app `.npmrc`. Add auth (do not commit tokens):

```ini
@query-grid:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

```powershell
npm install @query-grid/core@0.1.0-preview.2 @query-grid/primeng@0.1.0-preview.2
# or, for preview dist-tag: npm install @query-grid/core@preview
```

### Install docs for app authors

See [getting-started.md](../getting-started.md) for first-grid examples (registry-agnostic).

## Manual publish (optional mirrors)

### NuGet.org

```powershell
$apiKey = "<nuget.org-api-key>"
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.*.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
# repeat for Abstractions, Core, and optional .snupkg
```

### npmjs.com

Temporarily set `"registry": "https://registry.npmjs.org"` and `"access": "public"` in `publishConfig`, then:

```powershell
npm publish -w @query-grid/core --access public --tag preview
npm publish src/npm/packages/primeng/dist --access public --tag preview
```

Restore `publishConfig.registry` to `https://npm.pkg.github.com` before the next GitHub tag publish.

## Next releases

1. Bump all version locations (see table above).
2. Add a `CHANGELOG.md` section.
3. Test → tag `vX.Y.Z` → push → verify packages on GitHub **Packages** tab.
