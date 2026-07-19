using System.Linq.Expressions;

namespace QueryGrid.Core.Internal;

internal interface ISearchMatchBuilder
{
  Expression? BuildTextMatch(Expression member, string search, Type memberType);

  Expression? BuildGuidMatch(Expression member, string search);
}
