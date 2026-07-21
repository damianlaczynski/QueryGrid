# @query-grid/ui

laczynski/ui adapter for [QueryGrid](https://github.com/damianlaczynski/QueryGrid): `<qg-ui-data-grid>` with column filters (multi-rule, Match All / Match Any), global search, removable filter chips, multi-sort, pagination, and optional state persistence.

## Install

```powershell
npm install @query-grid/core @query-grid/ui @laczynski/ui
```

Peer dependencies: Angular 21+, `@laczynski/ui` 2.0.0-preview+, `@angular/cdk` 21+, RxJS 7+.

## Usage

Create a grid store with `createGridResource` (or inject `GridResourceFactory`), then bind it to `<qg-ui-data-grid>` and declare columns with `qgColumn` templates. The `qgColumn` / `qgEmpty` API mirrors `@query-grid/primeng`.

## Full guide

[Getting started](https://github.com/damianlaczynski/QueryGrid/blob/main/docs/getting-started.md)
