# QueryGrid.Core

QueryGrid engine: automatic DTO field discovery, filter/sort/search expression building, and `IQueryable` extensions. Provider-agnostic — no EF Core dependency.

## Install

```powershell
dotnet add package QueryGrid.Core
```

For EF Core apps, use `QueryGrid.EntityFrameworkCore` instead.

## Example

```csharp
var page = queryable
  .ApplyGridFilterAndSearch(query)
  .ApplyGridSort(query)
  .ApplyGridPaging(query);
```

## Full guide

[Getting started](https://github.com/damianlaczynski/query-grid/blob/main/docs/getting-started.md)
