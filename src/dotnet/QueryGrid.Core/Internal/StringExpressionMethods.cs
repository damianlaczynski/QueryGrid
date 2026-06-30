using System.Reflection;

namespace QueryGrid.Core.Internal;

/// <summary>Cached <see cref="string"/> method metadata for case-insensitive expression trees.</summary>
internal static class StringExpressionMethods
{
  public static readonly MethodInfo ToLowerInvariant =
    typeof(string).GetMethod(nameof(string.ToLowerInvariant), Type.EmptyTypes)!;

  public static readonly MethodInfo Contains =
    typeof(string).GetMethod(nameof(string.Contains), [typeof(string)])!;

  public static readonly MethodInfo StartsWith =
    typeof(string).GetMethod(nameof(string.StartsWith), [typeof(string)])!;

  public static readonly MethodInfo EndsWith =
    typeof(string).GetMethod(nameof(string.EndsWith), [typeof(string)])!;
}
