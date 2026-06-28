namespace QueryGrid.Abstractions;

/// <summary>
/// Base type for a node in a filter tree. A node is either a single
/// <see cref="FilterCondition"/> (a leaf) or a <see cref="FilterGroup"/> that combines
/// other nodes with a boolean operator.
/// </summary>
public abstract class FilterNode
{
}
