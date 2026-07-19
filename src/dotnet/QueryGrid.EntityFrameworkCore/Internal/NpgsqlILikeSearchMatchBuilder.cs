using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using QueryGrid.Core.Internal;

namespace QueryGrid.EntityFrameworkCore.Internal;

internal sealed class NpgsqlILikeSearchMatchBuilder : ISearchMatchBuilder
{
  public static NpgsqlILikeSearchMatchBuilder Instance { get; } = new();

  private static readonly Lazy<MethodInfo?> ILikeMethod = new(ResolveILikeMethod);

  public static bool IsAvailable => ILikeMethod.Value is not null;

  public Expression? BuildTextMatch(Expression member, string search, Type memberType)
  {
    var method = ILikeMethod.Value
      ?? throw new InvalidOperationException("Npgsql ILike is not available.");

    var efFunctions = Expression.Property(null, typeof(EF), nameof(EF.Functions));
    var pattern = Expression.Constant($"%{search}%");
    var ilike = Expression.Call(method, efFunctions, member, pattern);
    var notNull = Expression.NotEqual(member, Expression.Constant(null, memberType));
    return Expression.AndAlso(notNull, ilike);
  }

  public Expression? BuildGuidMatch(Expression member, string search)
    => DefaultSearchMatchBuilder.Instance.BuildGuidMatch(member, search);

  private static MethodInfo? ResolveILikeMethod()
  {
    var type = Type.GetType(
      "Microsoft.EntityFrameworkCore.NpgsqlDbFunctionsExtensions, Npgsql.EntityFrameworkCore.PostgreSQL",
      throwOnError: false);

    return type?.GetMethod(
      "ILike",
      BindingFlags.Public | BindingFlags.Static,
      binder: null,
      types: [typeof(DbFunctions), typeof(string), typeof(string)],
      modifiers: null);
  }
}
