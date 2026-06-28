namespace QueryGrid.Abstractions;

/// <summary>
/// Describes a single sort instruction. Multiple descriptors form a stable, ordered multi-sort.
/// </summary>
public sealed class SortDescriptor
{
  /// <summary>The name of the field to sort by, matching a discovered property on the row type.</summary>
  public string Field { get; set; } = string.Empty;

  /// <summary>When <see langword="true"/> the field is sorted in descending order; otherwise ascending.</summary>
  public bool Desc { get; set; }

  /// <summary>Creates an empty descriptor. Required for deserialization.</summary>
  public SortDescriptor()
  {
  }

  /// <summary>Creates a descriptor for the given field and direction.</summary>
  /// <param name="field">The field to sort by.</param>
  /// <param name="desc">Whether to sort descending.</param>
  public SortDescriptor(string field, bool desc = false)
  {
    Field = field;
    Desc = desc;
  }
}
