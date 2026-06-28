# Implementation guides

> **Scope:** how to write and verify code in this repository — not consumer install docs or CI configuration.
>
> For consumer quick start, see [getting-started.md](../getting-started.md). For run, CI, and publishing, see [`docs/technical/`](../technical/).

## Documents

| Document                                       | Read when you need to…                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| [repo-map.md](repo-map.md)                     | Find where code lives and which package owns what           |
| [dotnet-guidelines.md](dotnet-guidelines.md)   | C# packages, expression builders, transport, EF integration |
| [npm-guidelines.md](npm-guidelines.md)         | TypeScript packages, Angular libraries, PrimeNG grid        |
| [testing-guidelines.md](testing-guidelines.md) | Test layer ownership, anti-patterns, when to skip tests     |
| [feature-recipes.md](feature-recipes.md)       | Step-by-step recipes for common library work                |
| [getting-started.md](../getting-started.md)    | Install and first grid (consumer perspective)               |

## Start here by task

| Task                                | Documents                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| First orientation in the codebase   | [repo-map.md](repo-map.md)                                                                                                             |
| .NET package change                 | [repo-map.md](repo-map.md) + [dotnet-guidelines.md](dotnet-guidelines.md)                                                              |
| npm package change                  | [repo-map.md](repo-map.md) + [npm-guidelines.md](npm-guidelines.md)                                                                    |
| Transport or shared contract change | [dotnet-guidelines.md](dotnet-guidelines.md) + [npm-guidelines.md](npm-guidelines.md) + [testing-guidelines.md](testing-guidelines.md) |
| Verify before PR                    | [testing-guidelines.md](testing-guidelines.md) + [`AGENTS.md`](../../AGENTS.md)                                                        |
| End-to-end check                    | [`samples/README.md`](../../samples/README.md) + relevant guide                                                                        |

## Relationship to other docs

| Folder                       | Use for                                   |
| ---------------------------- | ----------------------------------------- |
| `docs/guides/` (this folder) | How to _implement_ the library            |
| `docs/technical/`            | How to _build, test, publish_ the repo    |
| `samples/`                   | Runnable apps that _consume_ the packages |

Commands shared across areas: [`AGENTS.md`](../../AGENTS.md).
