using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.EntityFrameworkCore;
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
    var result = await db.ShowcaseRows
      .AsNoTracking()
      .Select(row => new ShowcaseRowDto
      {
        Id = row.Id,
        Label = row.Label,
        OptionalNote = row.OptionalNote,
        Quantity = row.Quantity,
        BigNumber = row.BigNumber,
        Price = row.Price,
        Score = row.Score,
        IsActive = row.IsActive,
        OccurredAt = row.OccurredAt,
        OccurredAtOffset = row.OccurredAtOffset,
        OccurredOn = row.OccurredOn,
        Category = row.Category,
        ReferenceId = row.ReferenceId,
        InternalCode = row.InternalCode,
        SortDisabledField = row.SortDisabledField,
        FilterDisabledField = row.FilterDisabledField,
        NullableDate = row.NullableDate,
      })
      .ToGridResultAsync(grid!, cancellationToken: ct);

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

app.Run();
