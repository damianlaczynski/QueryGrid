using System.Text;
using ClosedXML.Excel;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.Export.Excel;
using static QueryGrid.UnitTests.TestFilters;

namespace QueryGrid.UnitTests;

public class ExportTests
{
  private static readonly GridExportColumn[] PersonColumns =
  [
    new GridExportColumn { Field = "Id", Header = "ID" },
    new GridExportColumn { Field = "Name", Header = "Name" },
    new GridExportColumn { Field = "Email", Header = "Email" }
  ];

  private sealed class CsvRow
  {
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
  }

  private static GridExportRequest PersonExportRequest(GridQuery? query = null, GridExportScope scope = GridExportScope.AllMatching, params string[] selectedKeys)
    => new()
    {
      Query = query ?? new GridQuery(),
      Scope = scope,
      SelectedKeys = selectedKeys.Length > 0 ? selectedKeys : null,
      Columns = PersonColumns
    };

  private static string ExportCsv<T>(IQueryable<T> source, GridExportRequest request)
  {
    using var stream = new MemoryStream();
    source.ExportToCsv(request, stream, exportOptions: new GridExportOptions { IncludeUtf8Bom = false });
    return Encoding.UTF8.GetString(stream.ToArray());
  }

  [Fact]
  public void ExportToCsv_quotes_commas_quotes_and_newlines()
  {
    var rows = new[]
    {
      new CsvRow { Id = 1, Name = "a,b", Email = "say \"hi\"" },
      new CsvRow { Id = 2, Name = "line1\nline2", Email = "plain" }
    }.AsQueryable();

    var csv = ExportCsv(rows, new GridExportRequest
    {
      Columns =
      [
        new GridExportColumn { Field = "Id", Header = "ID" },
        new GridExportColumn { Field = "Name", Header = "Name" },
        new GridExportColumn { Field = "Email", Header = "Email" }
      ]
    });

    Assert.Contains("1,\"a,b\",\"say \"\"hi\"\"\"", csv, StringComparison.Ordinal);
    Assert.Contains("2,\"line1\nline2\",plain", csv, StringComparison.Ordinal);
  }

  [Fact]
  public void ExportToCsv_formats_common_types()
  {
    var rows = new[]
    {
      new CsvRow
      {
        Id = 1,
        Name = "typed",
        IsActive = true,
        CreatedAt = new DateTime(2024, 1, 1)
      }
    }.AsQueryable();

    var csv = ExportCsv(rows, new GridExportRequest
    {
      Columns =
      [
        new GridExportColumn { Field = "Name", Header = "Name" },
        new GridExportColumn { Field = "IsActive", Header = "Active" },
        new GridExportColumn { Field = "CreatedAt", Header = "Created" }
      ]
    });

    Assert.Contains("typed,true,2024-01-01T00:00:00.0000000", csv, StringComparison.Ordinal);
  }

  [Fact]
  public void ExportToCsv_writes_header_and_filtered_rows()
  {
    var request = PersonExportRequest(new GridQuery
    {
      Filter = Cond("Age", FilterOperator.Gte, 30),
      Sort = [new SortDescriptor("Age", desc: true)]
    });

    using var stream = new MemoryStream();
    var result = TestData.Query().ExportToCsv(request, stream, exportOptions: new GridExportOptions { IncludeUtf8Bom = false });

    var csv = Encoding.UTF8.GetString(stream.ToArray());
    Assert.Equal(3, result.TotalMatchingCount);
    Assert.Equal(3, result.ExportedRowCount);
    Assert.False(result.Truncated);
    Assert.StartsWith("ID,Name,Email", csv, StringComparison.Ordinal);
    Assert.Contains("2,Bob,bob@test.com", csv, StringComparison.Ordinal);
    Assert.Contains("1,Alice,alice@example.com", csv, StringComparison.Ordinal);
    Assert.DoesNotContain("Charlie", csv, StringComparison.Ordinal);
  }

  [Fact]
  public void ExportToCsv_selected_keys_exports_only_matching_rows()
  {
    var request = PersonExportRequest(scope: GridExportScope.SelectedKeys, selectedKeys: ["1", "3"]);

    using var stream = new MemoryStream();
    var result = TestData.Query().ExportToCsv(request, stream, exportOptions: new GridExportOptions { IncludeUtf8Bom = false });

    var csv = Encoding.UTF8.GetString(stream.ToArray());
    Assert.Equal(2, result.TotalMatchingCount);
    Assert.Equal(2, result.ExportedRowCount);
    Assert.Contains("1,Alice,alice@example.com", csv, StringComparison.Ordinal);
    Assert.Contains("3,Charlie,", csv, StringComparison.Ordinal);
    Assert.DoesNotContain("Bob", csv, StringComparison.Ordinal);
  }

  [Fact]
  public void ExportToCsv_truncates_when_over_max_export_rows()
  {
    var request = PersonExportRequest();
    var options = new GridExportOptions { MaxExportRows = 2, IncludeUtf8Bom = false };

    using var stream = new MemoryStream();
    var result = TestData.Query().ExportToCsv(request, stream, exportOptions: options);

    Assert.Equal(4, result.TotalMatchingCount);
    Assert.Equal(2, result.ExportedRowCount);
    Assert.True(result.Truncated);
  }

  [Fact]
  public void ExportToCsv_requires_columns()
  {
    var request = new GridExportRequest { Query = new GridQuery(), Columns = [] };

    var ex = Assert.Throws<GridValidationException>(() =>
    {
      using var stream = new MemoryStream();
      TestData.Query().ExportToCsv(request, stream);
    });

    Assert.Equal(GridValidationCodes.ExportColumnsRequired, ex.Code);
  }

  [Fact]
  public void ExportToCsv_selected_scope_requires_keys()
  {
    var request = new GridExportRequest
    {
      Query = new GridQuery(),
      Scope = GridExportScope.SelectedKeys,
      Columns = PersonColumns
    };

    var ex = Assert.Throws<GridValidationException>(() =>
    {
      using var stream = new MemoryStream();
      TestData.Query().ExportToCsv(request, stream);
    });

    Assert.Equal(GridValidationCodes.ExportSelectionRequired, ex.Code);
  }

  [Fact]
  public void ExportToXlsx_writes_workbook_with_headers_and_rows()
  {
    var request = new GridExportRequest
    {
      Format = GridExportFormat.Xlsx,
      Query = new GridQuery
      {
        Filter = Cond("Age", FilterOperator.Gte, 30),
        Sort = [new SortDescriptor("Age", desc: true)]
      },
      Columns = PersonColumns
    };

    using var stream = new MemoryStream();
    var result = TestData.Query().ExportToXlsx(request, stream);

    Assert.Equal(3, result.TotalMatchingCount);
    Assert.Equal(3, result.ExportedRowCount);

    using var workbook = new ClosedXML.Excel.XLWorkbook(stream);
    var worksheet = workbook.Worksheet("Export");
    Assert.Equal("ID", worksheet.Cell(1, 1).GetString());
    Assert.Equal("Bob", worksheet.Cell(2, 2).GetString());
    Assert.Equal(4, worksheet.LastRowUsed()!.RowNumber());
  }
}
