using QueryGrid.Samples.ShowcaseApi.Models;

namespace QueryGrid.Samples.ShowcaseApi.Data;

public sealed class ShowcaseRow
{
  public int Id { get; set; }

  public string Label { get; set; } = "";

  public string? OptionalNote { get; set; }

  public int Quantity { get; set; }

  public long BigNumber { get; set; }

  public decimal Price { get; set; }

  public double Score { get; set; }

  public bool IsActive { get; set; }

  public DateTime OccurredAt { get; set; }

  public DateTimeOffset OccurredAtOffset { get; set; }

  public DateOnly OccurredOn { get; set; }

  public ShowcaseCategory Category { get; set; }

  public Guid ReferenceId { get; set; }

  public string InternalCode { get; set; } = "";

  public string SortDisabledField { get; set; } = "";

  public string FilterDisabledField { get; set; } = "";

  public DateTime? NullableDate { get; set; }
}
