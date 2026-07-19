# Technical documentation

> **Scope:** build, test, CI, and publishing — not how to implement library code.
>
> For implementation conventions, see [`docs/guides/`](../guides/). For consumer install, see [getting-started.md](../getting-started.md).

## Documents

| Document                       | Read when you need to…                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| [ci.md](ci.md)                 | Understand GitHub Actions, reproduce CI locally, or debug a failing pipeline job |
| [publishing.md](publishing.md) | NuGet on GitHub Packages (tag `v*`), npm manual on npmjs.com                     |

## Start here by task

| Task                              | Document                                               |
| --------------------------------- | ------------------------------------------------------ |
| PR failed on GitHub               | [ci.md](ci.md)                                         |
| First local build after clone     | [`AGENTS.md`](../../AGENTS.md)                         |
| Publish preview or stable release | [publishing.md](publishing.md)                         |
| Pack NuGet locally                | [`AGENTS.md`](../../AGENTS.md) → `npm run pack:backend` |

## When to add or extend technical docs

- CI workflow or required toolchain versions change → update [ci.md](ci.md) and `.github/workflows/ci.yml` in the same PR.
- Publishing process or version policy changes → update [publishing.md](publishing.md) and `CHANGELOG.md`.
- A new repeatable operational task appears (e.g. local feed setup) that is not implementation guidance.

Do **not** put C# or TypeScript coding conventions here (`docs/guides/`), consumer tutorials ([getting-started.md](../getting-started.md)), or API reference for public types (XML docs / package READMEs).

Commands shared across areas: [`AGENTS.md`](../../AGENTS.md).
