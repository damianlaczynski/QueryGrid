namespace QueryGrid.Abstractions;

/// <summary>
/// A composite node that combines child nodes with a boolean <see cref="FilterLogic"/> operator.
/// </summary>
public sealed class FilterGroup : FilterNode
{
  /// <summary>The boolean operator used to combine <see cref="Conditions"/>.</summary>
  public FilterLogic Logic { get; set; } = FilterLogic.And;

  /// <summary>The child nodes; each may be a <see cref="FilterCondition"/> or a nested <see cref="FilterGroup"/>.</summary>
  public IList<FilterNode> Conditions { get; set; } = new List<FilterNode>();
}
