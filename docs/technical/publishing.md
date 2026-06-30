# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Version `0.1.0-preview.1`

All packages ship together at the same version:

| Package                         | Registry                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| `QueryGrid.Abstractions`        | [NuGet.org](https://www.nuget.org/packages/QueryGrid.Abstractions)        |
| `QueryGrid.Core`                | [NuGet.org](https://www.nuget.org/packages/QueryGrid.Core)                |
| `QueryGrid.EntityFrameworkCore` | [NuGet.org](https://www.nuget.org/packages/QueryGrid.EntityFrameworkCore) |
| `@query-grid/core`              | [npm](https://www.npmjs.com/package/@query-grid/core)                     |
| `@query-grid/primeng`           | [npm](https://www.npmjs.com/package/@query-grid/primeng)                  |

### Where versions live

| Stack           | Location                                                       |
| --------------- | -------------------------------------------------------------- |
| NuGet (shared)  | `src/dotnet/Directory.Build.props` → `<Version>`               |
| npm per package | `src/npm/packages/*/package.json` → `"version"`                |
| primeng peer    | `peerDependencies["@query-grid/core"]` must match core version |

## Pre-publish checklist

From repository root:

```powershell
npm install
npm run test
npm run build
npm run lint
npm run pack:dotnet
npm run pack:npm
```

Verify artifacts:

- `artifacts/nuget/*.nupkg` — three packages + `.snupkg` symbol packages
- `artifacts/npm/query-grid-core-0.1.0-preview.1.tgz`
- `artifacts/npm/query-grid-primeng-0.1.0-preview.1.tgz`

Optional smoke test: run showcase apps (`npm run start:showcase-api`, `npm run start:showcase-ui`).

## Publish NuGet (nuget.org)

**Prerequisites:** [NuGet.org](https://www.nuget.org/) account and an API key (Account → API Keys → Create).

```powershell
$apiKey = "<your-nuget-api-key>"

dotnet nuget push artifacts/nuget/QueryGrid.Abstractions.0.1.0-preview.1.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
dotnet nuget push artifacts/nuget/QueryGrid.Core.0.1.0-preview.1.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.0.1.0-preview.1.nupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json

# Optional — symbol packages for debugging
dotnet nuget push artifacts/nuget/QueryGrid.Abstractions.0.1.0-preview.1.snupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
dotnet nuget push artifacts/nuget/QueryGrid.Core.0.1.0-preview.1.snupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
dotnet nuget push artifacts/nuget/QueryGrid.EntityFrameworkCore.0.1.0-preview.1.snupkg --api-key $apiKey --source https://api.nuget.org/v3/index.json
```

Publish **core before EF** is not required — packages are independent. Typical consumer install pulls `QueryGrid.EntityFrameworkCore` which depends on the others.

## Publish npm (npmjs.com)

**Prerequisites:** [npmjs.com](https://www.npmjs.com/) account, `npm login`, and access to the `@query-grid` scope (first publish sets it public via `publishConfig.access`).

Publish **core first**, then primeng (primeng peer-depends on core). Prerelease versions require an explicit dist-tag:

```powershell
npm publish -w @query-grid/core --access public --tag preview
npm publish src/npm/packages/primeng/dist --access public --tag preview
```

Consumers install with `@preview` until you ship a stable release:

```powershell
npm install @query-grid/core@preview @query-grid/primeng@preview
```

`@query-grid/primeng` is published from `dist/` after `ng-packagr` build — do not publish from the package source folder.

## After publish

1. Create a git tag and push:

   ```powershell
   git tag v0.1.0-preview.1
   git push origin v0.1.0-preview.1
   ```

2. Create a GitHub Release from the tag with `CHANGELOG.md` section `0.1.0-preview.1` as release notes.

3. Verify install from registries (outside this repo):

   ```powershell
   dotnet add package QueryGrid.EntityFrameworkCore --version 0.1.0-preview.1
   npm install @query-grid/core@0.1.0-preview.1 @query-grid/primeng@0.1.0-preview.1
   # or: npm install @query-grid/core@preview @query-grid/primeng@preview
   ```

## Consumer install

See [getting-started.md](../getting-started.md) for install commands and first-grid examples.

## Next releases

1. Bump `<Version>` in `Directory.Build.props` and all npm `package.json` files (including primeng `peerDependencies["@query-grid/core"]`).
2. Add a new section to `CHANGELOG.md`.
3. Repeat checklist → pack → publish → tag.
