# Publishing

> Scope: versioning and releasing `QueryGrid.*` NuGet packages and `@query-grid/*` npm packages.

## Versioning

- **SemVer** for all packages.
- Preview versions use `0.1.0-preview.N` (or similar) until the first stable release.
- `QueryGrid.Abstractions` is the stability anchor — breaking changes there require a major bump across the stack.
- Keep NuGet and npm preview versions aligned when shipping together.

### Where versions live

| Stack           | Location                                                              |
| --------------- | --------------------------------------------------------------------- |
| NuGet (shared)  | `src/dotnet/Directory.Build.props` → `<Version>` on packable projects |
| npm per package | `src/npm/packages/*/package.json` → `"version"`                       |

## Pack locally

```powershell
# NuGet → artifacts/nuget/
npm run pack:dotnet

# npm libraries
cd src/npm
npm run build:npm
# dist/ output under each package folder
```

## Publishing checklist

1. Update version in `Directory.Build.props` and all npm `package.json` files.
2. Update `CHANGELOG.md`.
3. Run `npm run test:all`, `npm run build:all`, and `npm run lint:npm`.4. Pack and smoke-test artifacts against a sample under `samples/`.
4. Publish to chosen registries (NuGet.org, GitHub Packages, npm).
5. Tag the release in git.

## Consumer install (after publish)

```powershell
dotnet add package QueryGrid.EntityFrameworkCore

npm install @query-grid/core @query-grid/primeng
```

Local development in this repo uses project references and workspace builds — consumers use published versions. Do not rely on path references from downstream apps once packages are on a feed.

## Registry choice

Document the chosen feed URLs in release notes when publishing is configured. Until then, verification happens via local pack + `samples/`.
