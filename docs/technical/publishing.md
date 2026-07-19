# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Registries

| Package                         | Registry                           | How to publish                                                     |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `QueryGrid.Abstractions`        | GitHub Packages                    | Tag `v*` → [publish workflow](../../.github/workflows/publish.yml) |
| `QueryGrid.Core`                | GitHub Packages                    | same                                                               |
| `QueryGrid.EntityFrameworkCore` | GitHub Packages                    | same                                                               |
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

4. Commit, tag, push — **NuGet publishes automatically**:

   ```powershell
   git tag v0.1.0-preview.3
   git push origin v0.1.0-preview.3
   ```

5. **npm — manual** (after tag push, same version):

   ```powershell
   npm login
   npm run build:npm
   npm publish -w @query-grid/core --access public --tag preview
   npm publish src/npm/packages/primeng/dist --access public --tag preview
   npm publish src/npm/packages/ui/dist --access public --tag preview
   ```

   Prerelease versions need `--tag preview` (or `alpha` / `beta`). Stable releases use `--tag latest` or omit `--tag`.

6. Create a GitHub Release from the tag with the matching `CHANGELOG.md` section.

### Publish workflow (NuGet only)

[`.github/workflows/publish.yml`](../../.github/workflows/publish.yml) on tag `v*`:

- Tests + lint (including npm unit tests)
- Packs and pushes NuGet to `https://nuget.pkg.github.com/<owner>/`
- Uses `GITHUB_TOKEN` (`packages: write`) — no secrets required

**GitHub settings:** Actions enabled; workflow permissions allow `packages: write` (see repo **Settings → Actions → General**).

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

## Optional: NuGet.org mirror

```powershell
$apiKey = "<nuget.org-api-key>"
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.*.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
```

## Next releases

1. Bump all version locations.
2. `CHANGELOG.md` section.
3. Tag → verify NuGet on GitHub **Packages** → publish npm manually → GitHub Release.
