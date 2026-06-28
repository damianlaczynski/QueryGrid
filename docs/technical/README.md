# Technical documentation

> **Scope:** build, test, CI, and publishing — not how to implement library code.
>
> For implementation conventions, see [`docs/guides/`](../guides/). For consumer install, see [getting-started.md](../getting-started.md).

## Documents

| Document                                                             | Read when you need to…                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [technical-documentation-guide.md](technical-documentation-guide.md) | Rules for when to add or extend docs in this folder                              |
| [ci.md](ci.md)                                                       | Understand GitHub Actions, reproduce CI locally, or debug a failing pipeline job |
| [publishing.md](publishing.md)                                       | Version and publish NuGet / npm packages                                         |

## Start here by task

| Task                              | Document                                               |
| --------------------------------- | ------------------------------------------------------ |
| PR failed on GitHub               | [ci.md](ci.md)                                         |
| First local build after clone     | [`AGENTS.md`](../../AGENTS.md)                         |
| Publish preview or stable release | [publishing.md](publishing.md)                         |
| Pack NuGet locally                | [`AGENTS.md`](../../AGENTS.md) → `npm run pack:dotnet` |

## Relationship to other docs

| Folder            | Use for                                     |
| ----------------- | ------------------------------------------- |
| `docs/guides/`    | How to _implement_ the library              |
| `docs/technical/` | How to _build, test, publish_ (this folder) |
| `samples/`        | Runnable verification apps                  |

Commands shared across areas: [`AGENTS.md`](../../AGENTS.md).
