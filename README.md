# QueryGrid

DevExtreme-style pagination, filtering, and sorting for .NET and Angular — as a standalone, reusable library.

## Packages

### NuGet (.NET 10)

| Package                         | Description                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `QueryGrid.Abstractions`        | Transport contracts (`GridQuery`, `GridResult`, filter/sort types, attributes) |
| `QueryGrid.Core`                | Engine: auto field discovery, expression building, `IQueryable` extensions     |
| `QueryGrid.EntityFrameworkCore` | `ToGridResultAsync` for EF Core                                                |

### npm

| Package               | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `@query-grid/core`    | TypeScript models, helpers (`formatGridError`, `formatLocalDateTime`)      |
| `@query-grid/primeng` | `<qg-prime-data-grid>` PrimeNG table with column filters, search and Clear |

## Quick start

See [docs/getting-started.md](docs/getting-started.md) for install steps and code examples.

## Repository layout

```
src/dotnet/          .NET solution (QueryGrid.* NuGet packages)
src/npm/             npm workspaces (@query-grid/*)
samples/             showcase apps — data types & scenario matrix (integration verification)
docs/                guides and technical docs (start at docs/README.md)
AGENTS.md            AI / contributor fast-start
.github/workflows/   CI
```

## Development

```powershell
# From repository root
npm run install:npm
npm run test:all
npm run build:all
npm run lint:npm
npm run pack:dotnet
```

Detailed commands and conventions: [AGENTS.md](AGENTS.md).

## Documentation

| Area                  | Entry                                                |
| --------------------- | ---------------------------------------------------- |
| Implementation guides | [docs/guides/README.md](docs/guides/README.md)       |
| CI and publishing     | [docs/technical/README.md](docs/technical/README.md) |
| Consumer quick start  | [docs/getting-started.md](docs/getting-started.md)   |

## License

MIT — see [LICENSE](LICENSE).
