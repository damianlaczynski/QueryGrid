using Microsoft.EntityFrameworkCore;
using QueryGrid.Samples.ShowcaseApi.Data;
using QueryGrid.Samples.ShowcaseApi.Models;

namespace QueryGrid.Samples.ShowcaseApi;

internal static class ShowcaseQueries
{
  public static IQueryable<ShowcaseRowDto> Rows(ShowcaseDbContext db)
    => db.ShowcaseRows
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
      });
}
