# QueryGrid.EntityFrameworkCore

EF Core integration for [QueryGrid](https://github.com/damianlaczynski/query-grid): async count, filter, sort, and page via `ToGridResultAsync`.

## Install

```powershell
dotnet add package QueryGrid.EntityFrameworkCore
```

## Example

```csharp
var grid = await db.Issues.AsNoTracking()
  .Select(i => new IssueDto { Id = i.Id, Title = i.Title })
  .ToGridResultAsync(request.Grid, cancellationToken: ct);
```

Deserialize `GridQuery` in your API layer — see the getting-started guide for JSON binding.

## Full guide

[Getting started](https://github.com/damianlaczynski/query-grid/blob/main/docs/getting-started.md)
