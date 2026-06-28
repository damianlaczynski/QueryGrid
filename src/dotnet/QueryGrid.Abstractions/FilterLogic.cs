namespace QueryGrid.Abstractions;

/// <summary>
/// Boolean operator used to combine the children of a <see cref="FilterGroup"/>.
/// </summary>
public enum FilterLogic
{
  /// <summary>All child nodes must match.</summary>
  And,

  /// <summary>At least one child node must match.</summary>
  Or
}
