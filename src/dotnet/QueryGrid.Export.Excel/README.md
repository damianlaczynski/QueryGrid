# QueryGrid.Export.Excel

Excel (`.xlsx`) export for [QueryGrid](https://github.com/damianlaczynski/QueryGrid). Applies the same `GridExportRequest` pipeline as CSV export and writes an Open XML workbook via [ClosedXML](https://github.com/ClosedXML/ClosedXML).

## Install

```bash
dotnet add package QueryGrid.Export.Excel
```

Requires `QueryGrid.Core` (pulled in transitively).

## Usage

```csharp
using QueryGrid.Export.Excel;

await db.Issues
  .AsNoTracking()
  .Select(issue => new IssueDto { /* … */ })
  .ExportToXlsxAsync(exportRequest, response.Body, cancellationToken: ct);
```

Set `GridExportRequest.Format` to `GridExportFormat.Xlsx`.
