# .NET Guidelines

> Scope: conventions for implementing work in the `QueryGrid.*` NuGet packages.

## Stack summary

.NET 10 class libraries with central package management (`Directory.Packages.props`), XML documentation on public API, and xUnit v3 unit tests. No host application lives in this repository — runnable APIs belong in `samples/`.

For build, test, and pack commands, see `AGENTS.md`.

## Package ownership

### QueryGrid.Abstractions

- Owns transport contracts: `GridQuery`, `GridResult<T>`, `FilterNode`, `SortDescriptor`, enums.
- Owns grid metadata attributes on DTO properties.
- Owns `GridValidationException`, `FilterNodeJsonConverter`, and `GridQueryJson.CreateOptions()` (shared JSON serializer setup).
- Must remain dependency-free — breaking changes here require a major version bump.

### QueryGrid.Core

- Owns automatic field discovery from DTO public properties.
- Owns filter, sort, search, and paging expression building.
- Owns `GridQueryableExtensions` and `GridOptions` limits.
- Must not reference EF Core or ASP.NET Core.

### QueryGrid.EntityFrameworkCore

- Owns `ToGridResultAsync` and EF-specific execution (count + page).
- Depends on `QueryGrid.Core` and `Microsoft.EntityFrameworkCore`.

## Standard path for a new capability

1. Add or extend types in `QueryGrid.Abstractions` if the transport contract changes.
2. Implement behavior in `QueryGrid.Core` (expression builder, schema rule, or option).
3. Add EF integration only when the feature is host-specific.
4. Add unit tests in `QueryGrid.UnitTests` — name tests by behavior, not by class name alone.
5. If JSON shape changes, update `@query-grid/core` types and `GridQueryContractTests`.
6. Verify in `samples/` when a runnable scenario exists.

## Expression and schema conventions

- Field operators are inferred from CLR type — do not add per-entity configuration maps.
- Use `[GridIgnore]`, `[GridSort(false)]`, `[GridFilter(false)]` for opt-out on DTO properties.
- Reject invalid operator/type combinations with `GridValidationException` — never silently ignore.
- String filtering uses case-insensitive matching consistent with existing `FilterExpressionBuilder` behavior.

## Public API conventions

- Keep namespaces `QueryGrid.*` matching package names.
- Document public members with XML comments — they appear in NuGet package docs.
- Internal helpers live under `Internal/` folders and use `internal` visibility.

## What does not belong here

- Application endpoints, DbContext, or domain entities — those live in `samples/` or consumer apps.
- FastEndpoints-specific binders — optional future package (`QueryGrid.FastEndpoints`), not in Core.
