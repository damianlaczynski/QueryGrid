# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Registries

| Package                         | Primary registry                   | Secondary (NuGet only) |
| ------------------------------- | ---------------------------------- | ---------------------- |
| `QueryGrid.Abstractions`        | [nuget.org](https://www.nuget.org) | GitHub Packages        |
| `QueryGrid.Core`                | [nuget.org](https://www.nuget.org) | GitHub Packages        |
| `QueryGrid.EntityFrameworkCore` | [nuget.org](https://www.nuget.org) | GitHub Packages        |
| `@query-grid/core`              | [npmjs.com](https://www.npmjs.com) | —                      |
| `@query-grid/primeng`           | [npmjs.com](https://www.npmjs.com) | —                      |
| `@query-grid/ui`                | [npmjs.com](https://www.npmjs.com) | —                      |

All packages publish on tag push `v*` via [publish.yml](../../.github/workflows/publish.yml) (trusted publishing / OIDC).

NuGet `RepositoryUrl` links packages to this repo on first GitHub Packages publish.

## Where versions live

| Stack           | Location                                                       |
| --------------- | -------------------------------------------------------------- |
| NuGet (shared)  | `src/dotnet/Directory.Build.props` → `<Version>`               |
| npm per package | `src/npm/packages/*/package.json` → `"version"`                |
| primeng / ui    | `peerDependencies["@query-grid/core"]` must match core version |

## Release checklist

1. Bump versions in `Directory.Build.props` and npm `package.json` files.
2. Update `CHANGELOG.md`.
3. Verify locally:

   ```powershell
   npm run test:all
   npm run build:all
   npm run lint:frontend
   npm run pack:backend
   npm run pack:npm
   ```

4. Tag and push:

   ```powershell
   git tag v0.1.0-preview.8
   git push origin v0.1.0-preview.8
   ```

   [publish.yml](../../.github/workflows/publish.yml) runs tests, then publishes NuGet (nuget.org + GitHub Packages), npm (npmjs.com), and creates a GitHub Release from `CHANGELOG.md`.

## One-time setup

### GitHub secret

Settings → Secrets and variables → Actions:

| Secret       | Value                              |
| ------------ | ---------------------------------- |
| `NUGET_USER` | nuget.org profile name (not email) |

### nuget.org trusted publishing

1. [nuget.org](https://www.nuget.org) → profile → **Trusted Publishing** → **Add**.
2. Policy fields:

   | Field            | Value              |
   | ---------------- | ------------------ |
   | Package Owner    | your nuget.org account |
   | Repository Owner | `damianlaczynski`  |
   | Repository       | `QueryGrid`        |
   | Workflow File    | `publish.yml`      |
   | Environment      | *(leave empty)*    |

### npm trusted publishing

For each package (`@query-grid/core`, `@query-grid/primeng`, `@query-grid/ui`):

npmjs.com → package → **Settings** → **Trusted Publisher** → **GitHub Actions**:

| Field                | Value             |
| -------------------- | ----------------- |
| Organization or user | `damianlaczynski` |
| Repository           | `QueryGrid`       |
| Workflow filename    | `publish.yml`     |
| Environment          | *(leave empty)*   |

No `NPM_TOKEN` secret — CI uses OIDC (npm CLI ≥ 11.5.1, upgraded in the workflow).

### GitHub repository settings

Actions enabled; workflow permissions allow `packages: write` and OIDC (`id-token: write` is set in the workflow).

## Publish workflow (tag `v*`)

[`.github/workflows/publish.yml`](../../.github/workflows/publish.yml):

1. Test + lint
2. Pack NuGet + npm
3. Publish NuGet to **nuget.org** and **GitHub Packages** (OIDC + `GITHUB_TOKEN`)
4. Publish npm to **npmjs.com** with `--provenance` (OIDC)
5. Create GitHub Release from `CHANGELOG.md`

Prerelease tags (`v*-*`) publish npm with dist-tag `preview`; stable tags use `latest`.

## Consumer setup

### NuGet (nuget.org)

```powershell
dotnet add package QueryGrid.EntityFrameworkCore --version 0.1.0-preview.8
```

### NuGet (GitHub Packages)

Copy [`nuget.config.example`](nuget.config.example). Replace `OWNER` with `damianlaczynski`.

```powershell
dotnet nuget add source --username YOUR_GITHUB_USERNAME --password YOUR_PAT --store-password-in-clear-text --name github "https://nuget.pkg.github.com/OWNER/index.json"
dotnet add package QueryGrid.EntityFrameworkCore --version 0.1.0-preview.8
```

In GitHub Actions on a consuming repo, use `GITHUB_TOKEN` with read access to the package.

### npm (npmjs.com)

Public packages — no special `.npmrc` required:

```powershell
npm install @query-grid/core@preview @query-grid/primeng@preview @query-grid/ui@preview
```

### App integration

See [getting-started.md](../getting-started.md).

## Optional: local NuGet.org push (API key)

Trusted publishing works in CI only. For a local push without OIDC:

```powershell
$apiKey = "<nuget.org-api-key>"
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.*.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
```
