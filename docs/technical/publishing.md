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

4. Push a release tag — **CI publishes everything**:

   ```powershell
   npm run release:dry-run   # preview
   npm run release           # test → git tag + push → CI does the rest
   ```

   Or manually:

   ```powershell
   git tag v0.1.0-preview.4
   git push origin v0.1.0-preview.4
   ```

   On tag push, [publish.yml](../../.github/workflows/publish.yml) runs tests, then publishes:
   - NuGet → nuget.org + GitHub Packages
   - npm → npmjs.com (`preview` tag for prereleases, `latest` for stable)
   - GitHub Release with notes from `CHANGELOG.md`

5. **One-time GitHub secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   | ------ | ----- |
   | `NUGET_USER` | nuget.org profile name (not email) |
   | `NPM_TOKEN` | npm automation token with publish access to `@query-grid/*` |

6. **One-time nuget.org trusted publishing** — see below.

### Publish workflow (tag `v*`)

[`.github/workflows/publish.yml`](../../.github/workflows/publish.yml) on tag push:

- Tests + lint
- Pack NuGet + npm
- Publish NuGet to **nuget.org** via [trusted publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing) (OIDC)
- Mirror NuGet to GitHub Packages
- Publish npm to npmjs.com
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

Copy [`.env.example`](../../.env.example) to `.env` for local `npm run release` defaults. Never commit `.env`.

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
# or: npm install @query-grid/core@0.1.0-preview.3
```

### App integration

See [getting-started.md](../getting-started.md).

## Optional: local NuGet.org push (API key)

Trusted publishing works in CI only. For a local push without OIDC, set `NUGET_ORG_API_KEY` in `.env` (see `.env.example`) or:

```powershell
$apiKey = "<nuget.org-api-key>"
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.*.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
```

## Next releases

1. Bump all version locations.
2. `CHANGELOG.md` section.
3. `npm run release` (or push tag manually) → CI publishes everything.
