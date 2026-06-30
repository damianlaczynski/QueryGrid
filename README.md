# QueryGrid

Server-driven pagination, filtering, and sorting for .NET and Angular — as a standalone, reusable library.

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
AGENTS.md            contributor fast-start (commands, task routing)
.github/workflows/   CI
```

## Development

Install once, then build and test from the repository root. Full command list: [AGENTS.md](AGENTS.md).

```powershell
npm install
npm run test
npm run build
```

## Documentation

| Area                  | Entry                                                |
| --------------------- | ---------------------------------------------------- |
| Consumer quick start  | [docs/getting-started.md](docs/getting-started.md)   |
| Implementation guides | [docs/guides/README.md](docs/guides/README.md)       |
| CI and publishing     | [docs/technical/README.md](docs/technical/README.md) |

## License

MIT — see [LICENSE](LICENSE).
