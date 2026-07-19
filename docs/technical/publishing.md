# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Registries

| Package                         | Registry                           | How to publish                                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `QueryGrid.Abstractions`        | [nuget.org](https://www.nuget.org) | Tag `v*` → [publish workflow](../../.github/workflows/publish.yml) (trusted publishing) |
| `QueryGrid.Core`                | [nuget.org](https://www.nuget.org) | same                                                               |
| `QueryGrid.EntityFrameworkCore` | [nuget.org](https://www.nuget.org) | same                                                               |
| `QueryGrid.*` (mirror)          | GitHub Packages                    | same workflow (secondary feed)                                     |
| `@query-grid/core`              | [npmjs.com](https://www.npmjs.com) | Tag `v*` → [publish workflow](../../.github/workflows/publish.yml) |
| `@query-grid/primeng`           | [npmjs.com](https://www.npmjs.com) | same                                                               |
| `@query-grid/ui`                | [npmjs.com](https://www.npmjs.com) | same                                                               |
| `@query-grid/*` (mirror)        | GitHub Packages (npm)              | same workflow (secondary feed)                                     |

NuGet `RepositoryUrl` links packages to this repo on first GitHub Packages publish.

## Where versions live

| Stack           | Location                                                       |
| --------------- | -------------------------------------------------------------- |
| NuGet (shared)  | `src/dotnet/Directory.Build.props` → `<Version>`               |
| npm per package | `src/npm/packages/*/package.json` → `"version"`                |
| primeng peer    | `peerDependencies["@query-grid/core"]` must match core version |

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

4. Tag and push — **CI publishes everything**:

   ```powershell
   git tag v0.1.0-preview.4
   git push origin v0.1.0-preview.4
   ```

   On tag push, [publish.yml](../../.github/workflows/publish.yml) runs tests, then publishes:
   - NuGet → nuget.org + GitHub Packages
   - npm → npmjs.com + GitHub Packages
   - GitHub Release with notes from `CHANGELOG.md`

5. **One-time GitHub secret** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   | ------ | ----- |
   | `NUGET_USER` | nuget.org profile name (not email) |

6. **One-time npm trusted publishing** — for each package (`@query-grid/core`, `@query-grid/primeng`, `@query-grid/ui`):

   npmjs.com → package → **Settings** → **Trusted Publisher** → **GitHub Actions**:

   | Field | Value |
   | ----- | ----- |
   | Organization or user | `damianlaczynski` |
   | Repository | `QueryGrid` |
   | Workflow filename | `publish.yml` |
   | Environment | *(leave empty)* |

   No `NPM_TOKEN` secret is required — CI uses OIDC (npm CLI ≥ 11.5.1).

7. **One-time nuget.org trusted publishing** — see below.

### Publish workflow (tag `v*`)

[`.github/workflows/publish.yml`](../../.github/workflows/publish.yml) on tag push:

- Tests + lint
- Pack NuGet + npm
- Publish NuGet to **nuget.org** via [trusted publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing) (OIDC)
- Mirror NuGet to GitHub Packages
- Publish npm to npmjs.com via [trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC) and GitHub Packages
- Create GitHub Release from `CHANGELOG.md`

**One-time nuget.org trusted publishing:**

1. Log in at [nuget.org](https://www.nuget.org) → your profile → **Trusted Publishing** → **Add**.
2. Policy fields:

   | Field             | Value              |
   | ----------------- | ------------------ |
   | Package Owner     | your nuget.org account |
   | Repository Owner  | `damianlaczynski`  |
   | Repository        | `QueryGrid`        |
   | Workflow File     | `publish.yml`      |
   | Environment       | *(leave empty)*    |

3. GitHub repo → **Settings → Secrets and variables → Actions** → add `NUGET_USER` (see step 5 above).

**GitHub settings:** Actions enabled; workflow permissions allow `packages: write` and OIDC (`id-token: write` is set in the workflow).

## Consumer setup

### NuGet (GitHub Packages)

Copy [`nuget.config.example`](nuget.config.example). Replace `OWNER` with `damianlaczynski`.

```powershell
dotnet nuget add source --username YOUR_GITHUB_USERNAME --password YOUR_PAT --store-password-in-clear-text --name github "https://nuget.pkg.github.com/OWNER/index.json"
dotnet add package QueryGrid.EntityFrameworkCore --version 0.1.0-preview.3
```

In GitHub Actions on a consuming repo, use `GITHUB_TOKEN` with read access to the package.

### npm (npmjs.com)

Public packages — no special `.npmrc` required:

```powershell
npm install @query-grid/core@preview @query-grid/primeng@preview @query-grid/ui@preview
# or: npm install @query-grid/core@0.1.0-preview.4
```

### npm (GitHub Packages)

Add to the consuming app's `.npmrc` (use a PAT with `read:packages` for private repos; public repo packages may work with `GITHUB_TOKEN` in CI):

```ini
@query-grid:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

```powershell
npm install @query-grid/core@0.1.0-preview.4
```

Packages appear under the repository **Packages** tab after the first successful publish. Because the scope is `@query-grid` (not `@damianlaczynski`), link them to this repo manually once in **Package settings → Connect repository** if GitHub does not auto-link.

### App integration

See [getting-started.md](../getting-started.md).

## Optional: local NuGet.org push (API key)

Trusted publishing works in CI only. For a local push without OIDC:

```powershell
$apiKey = "<nuget.org-api-key>"
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.*.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
```

## Next releases

1. Bump all version locations.
2. `CHANGELOG.md` section.
3. Push tag → CI publishes everything.
