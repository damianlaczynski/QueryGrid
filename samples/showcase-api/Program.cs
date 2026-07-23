using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.EntityFrameworkCore;
using QueryGrid.Export.Excel;
using QueryGrid.Samples.ShowcaseApi;
using QueryGrid.Samples.ShowcaseApi.Data;
using QueryGrid.Samples.ShowcaseApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ShowcaseDbContext>(options =>
  options.UseInMemoryDatabase("QueryGridShowcase"));

builder.Services.AddCors(options =>
{
  options.AddDefaultPolicy(policy =>
  {
    policy
      .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200"])
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

var app = builder.Build();

app.UseCors();

using (var scope = app.Services.CreateScope())
{
  var db = scope.ServiceProvider.GetRequiredService<ShowcaseDbContext>();
  db.Database.EnsureCreated();
  ShowcaseSeed.Apply(db);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/rows", async (HttpContext http, ShowcaseDbContext db, CancellationToken ct) =>
{
  var gridJson = http.Request.Query[GridQueryBinding.GridQueryParameter].ToString();
  if (!GridQueryBinding.TryDeserialize(gridJson, out var grid, out var jsonError))
  {
    return Results.Problem(
      title: "Grid query validation failed",
      detail: $"The grid query is not valid JSON: {jsonError}",
      statusCode: StatusCodes.Status400BadRequest,
      extensions: new Dictionary<string, object?> { ["code"] = GridTransportErrorCodes.InvalidGridJson });
  }

  try
  {
    var result = await ShowcaseQueries.Rows(db).ToGridResultAsync(grid!, cancellationToken: ct);
    return Results.Ok(result);
  }
  catch (GridValidationException ex)
  {
    return Results.Problem(
      title: "Grid query validation failed",
      detail: ex.Message,
      statusCode: StatusCodes.Status400BadRequest,
      extensions: new Dictionary<string, object?> { ["code"] = ex.Code });
  }
});

app.MapPost("/rows/export", async (HttpContext http, ShowcaseDbContext db, CancellationToken ct) =>
{
  var (request, jsonError) = await GridExportBinding.TryDeserializeAsync(http.Request.Body, ct);
  if (request is null)
  {
    return Results.Problem(
      title: "Grid export validation failed",
      detail: $"The export request is not valid JSON: {jsonError}",
      statusCode: StatusCodes.Status400BadRequest,
      extensions: new Dictionary<string, object?> { ["code"] = GridTransportErrorCodes.InvalidGridJson });
  }

  try
  {
    var rows = ShowcaseQueries.Rows(db);
    var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var (contentType, extension) = request.Format switch
    {
      GridExportFormat.Xlsx => (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsx"),
      _ => ("text/csv", "csv")
    };

    return Results.Stream(
      async stream =>
      {
        if (request.Format == GridExportFormat.Xlsx)
        {
          await rows.ExportToXlsxAsync(request, stream, cancellationToken: ct);
        }
        else
        {
          await rows.ExportToCsvAsync(request, stream, cancellationToken: ct);
        }
      },
      contentType: contentType,
      fileDownloadName: $"showcase-rows-{date}.{extension}");
  }
  catch (GridValidationException ex)
  {
    return Results.Problem(
      title: "Grid export validation failed",
      detail: ex.Message,
      statusCode: StatusCodes.Status400BadRequest,
      extensions: new Dictionary<string, object?> { ["code"] = ex.Code });
  }
});

app.Run();
