using QueryGrid.Abstractions;

namespace QueryGrid.Samples.ShowcaseApi.Models;

public sealed class ShowcaseRowDto
{
  public int Id { get; init; }

  [GridSearchable]
  public string Label { get; init; } = "";

  public string? OptionalNote { get; init; }

  public int Quantity { get; init; }

  public long BigNumber { get; init; }

  public decimal Price { get; init; }

  public double Score { get; init; }

  public bool IsActive { get; init; }

  public DateTime OccurredAt { get; init; }

  public DateTimeOffset OccurredAtOffset { get; init; }

  public DateOnly OccurredOn { get; init; }

  [GridEnumOrder(
    ShowcaseCategory.Beta,
    ShowcaseCategory.Alpha,
    ShowcaseCategory.Gamma,
    ShowcaseCategory.Delta,
    ShowcaseCategory.Epsilon)]
  public ShowcaseCategory Category { get; init; }

  [GridSearchable]
  public Guid ReferenceId { get; init; }

  [GridIgnore]
  public string InternalCode { get; init; } = "";

  [GridSort(false)]
  public string SortDisabledField { get; init; } = "";

  [GridFilter(false)]
  public string FilterDisabledField { get; init; } = "";

  public DateTime? NullableDate { get; init; }
}
