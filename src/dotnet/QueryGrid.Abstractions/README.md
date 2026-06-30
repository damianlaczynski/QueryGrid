# QueryGrid.Abstractions

Transport contracts for [QueryGrid](https://github.com/damianlaczynski/query-grid): `GridQuery`, `GridResult`, filter/sort types, DTO attributes, and JSON serialization helpers. Zero dependencies.

## Install

```powershell
dotnet add package QueryGrid.Abstractions
```

Most apps reference `QueryGrid.EntityFrameworkCore` instead, which pulls this package in transitively.

## Example

```csharp
using QueryGrid.Abstractions.Serialization;

var options = GridQueryJson.CreateOptions();
var query = JsonSerializer.Deserialize<GridQuery>(json, options);
```

## Full guide

[Getting started](https://github.com/damianlaczynski/query-grid/blob/main/docs/getting-started.md)
