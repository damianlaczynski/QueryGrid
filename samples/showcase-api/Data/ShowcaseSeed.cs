using QueryGrid.Samples.ShowcaseApi.Models;

namespace QueryGrid.Samples.ShowcaseApi.Data;

public static class ShowcaseSeed
{
  public const int RowCount = 300;

  private static readonly string[] _labelPrefixes =
  [
    "Alpha", "Beta", "Gamma", "Delta", "Omega", "Nova", "Pixel", "Vector", "Matrix", "Quantum",
  ];

  private static readonly string[] _noteFragments =
  [
    "priority", "review", "hold", "archive", "draft", "urgent", "batch", "sample", "edge", "null-case",
  ];

  public static void Apply(ShowcaseDbContext db)
  {
    if (db.ShowcaseRows.Any())
    {
      return;
    }

    var baseDate = new DateTime(2024, 1, 1, 8, 0, 0, DateTimeKind.Utc);
    var categories = Enum.GetValues<ShowcaseCategory>();
    var rows = new List<ShowcaseRow>(RowCount);

    for (var id = 1; id <= RowCount; id++)
    {
      var prefix = _labelPrefixes[id % _labelPrefixes.Length];
      var category = categories[id % categories.Length];
      var occurredAt = baseDate.AddDays(id % 365).AddHours(id % 24);

      rows.Add(new ShowcaseRow
      {
        Id = id,
        Label = $"{prefix} item {id:D4}",
        OptionalNote = id % 10 == 0 ? null : $"{_noteFragments[id % _noteFragments.Length]} #{id}",
        Quantity = id % 100,
        BigNumber = 1_000_000L + id * 97L,
        Price = Math.Round((id % 50) * 1.99m + 0.01m, 4),
        Score = Math.Round((id % 37) * 0.137, 3),
        IsActive = id % 3 != 0,
        OccurredAt = occurredAt,
        OccurredAtOffset = new DateTimeOffset(occurredAt).AddMinutes(id % 60),
        OccurredOn = DateOnly.FromDateTime(occurredAt),
        Category = category,
        ReferenceId = Guid.Parse($"aaaaaaaa-bbbb-cccc-dddd-{id:000000000000}"),
        InternalCode = $"INT-{id:X4}",
        SortDisabledField = $"sort-off-{id % 7}",
        FilterDisabledField = $"filter-off-{id % 11}",
        NullableDate = id % 8 == 0 ? null : occurredAt.AddDays(-(id % 30)),
      });
    }

    db.ShowcaseRows.AddRange(rows);
    db.SaveChanges();
  }
}
