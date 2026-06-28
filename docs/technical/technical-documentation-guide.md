# Technical documentation guide

> When to add or extend files under `docs/technical/`.

## Add a technical doc when

- CI workflow or required toolchain versions change → update [ci.md](ci.md) and `.github/workflows/ci.yml`.
- Publishing process or version policy changes → update [publishing.md](publishing.md).
- A new repeatable operational task appears (e.g. local feed setup) that is not implementation guidance.

## Do not put here

- C# or TypeScript coding conventions → `docs/guides/`
- Consumer tutorials → [getting-started.md](../getting-started.md)
- API reference for public types → XML docs / package READMEs

## Keep in sync

When changing `.github/workflows/ci.yml`, update [ci.md](ci.md) in the same PR.

When changing version locations or release steps, update [publishing.md](publishing.md) and `CHANGELOG.md`.
