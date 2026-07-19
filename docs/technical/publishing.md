# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Registries

| Package                         | Registry                           | How to publish                                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `QueryGrid.Abstractions`        | [nuget.org](https://www.nuget.org) | Tag `v*` → [publish workflow](../../.github/workflows/publish.yml) (trusted publishing) |
| `QueryGrid.Core`                | [nuget.org](https://www.nuget.org) | same                                                               |
| `QueryGrid.EntityFrameworkCore` | [nuget.org](https://www.nuget.org) | same                                                               |
| `QueryGrid.*` (mirror)          | GitHub Packages                    | same workflow (secondary feed)                                     |
| `@query-grid/core`              | [npmjs.com](https://www.npmjs.com) | **Manual** after tag (see below)                                   |
| `@query-grid/primeng`           | [npmjs.com](https://www.npmjs.com) | **Manual** after tag (see below)                                   |

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

4. Commit, tag, push — **NuGet publishes automatically** (or use the release script):

   ```powershell
   npm run release:dry-run   # preview steps
   npm run release           # test → pack → tag → push → npm → GitHub Release
   ```

   Manual alternative:

   ```powershell
   git tag v0.1.0-preview.4
   git push origin v0.1.0-preview.4
   ```

5. **npm** — included in `npm run release`, or manual after tag push:

   ```powershell
   npm login
   npm run build:npm
   npm publish -w @query-grid/core --access public --tag preview
   npm publish src/npm/packages/primeng/dist --access public --tag preview
   npm publish src/npm/packages/ui/dist --access public --tag preview
   ```

   Prerelease versions need `--tag preview` (or `alpha` / `beta`). Stable releases use `--tag latest` or omit `--tag`.

6. Create a GitHub Release from the tag with the matching `CHANGELOG.md` section (included in `npm run release` when `RELEASE_CREATE_GITHUB_RELEASE=true`).

### Release script (`.env`)

Copy [`.env.example`](../../.env.example) to `.env` and fill in tokens. Then:

| Command | What it does |
| ------- | ------------ |
| `npm run release:dry-run` | Prints all steps without executing |
| `npm run release` | `test:all` → pack → git tag + push → npm publish → `gh release create` |

| `.env` variable | Required for |
| --------------- | ------------ |
| `NPM_TOKEN` | npm publish |
| `GITHUB_TOKEN` | `gh release create` (optional if `gh auth login` is active) |
| `NUGET_USER` | GitHub secret for CI NuGet trusted publishing (not used by the script directly) |
| `RELEASE_DRY_RUN` | Default dry-run mode when `true` |
| `RELEASE_CREATE_GITHUB_RELEASE` | Set `false` to skip GitHub Release |
| `RELEASE_PRERELEASE` | `true` for `-preview` / prerelease versions |

Flags: `--skip-tests`, `--skip-tag`, `--skip-npm`, `--skip-github-release`.

**Prerequisites:** clean git working tree, `CHANGELOG.md` section for the current version, `gh` CLI installed, nuget.org trusted publishing policy + `NUGET_USER` secret configured for CI.

### Publish workflow (NuGet)

[`.github/workflows/publish.yml`](../../.github/workflows/publish.yml) on tag `v*`:

- Tests + lint (including npm unit tests)
- Packs and pushes NuGet to **nuget.org** via [trusted publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing) (OIDC — no long-lived API key in CI)
- Mirrors the same packages to GitHub Packages

**One-time nuget.org setup:**

1. Log in at [nuget.org](https://www.nuget.org) → your profile → **Trusted Publishing** → **Add**.
2. Policy fields (match the repo):

   | Field             | Value              |
   | ----------------- | ------------------ |
   | Package Owner     | your nuget.org account |
   | Repository Owner  | `damianlaczynski`  |
   | Repository        | `QueryGrid`        |
   | Workflow File     | `publish.yml`      |
   | Environment       | *(leave empty)*    |

3. GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**:
   - Name: `NUGET_USER`
   - Value: your **nuget.org profile name** (not email) — same as `NUGET_USER` in `.env`

Copy [`.env.example`](../../.env.example) to `.env` for local release tokens (npm, optional local NuGet push). Never commit `.env`.

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
3. Tag → verify NuGet on GitHub **Packages** → publish npm manually → GitHub Release.
