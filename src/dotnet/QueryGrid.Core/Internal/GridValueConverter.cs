using System.Globalization;
using System.Text.Json;
using QueryGrid.Abstractions;

namespace QueryGrid.Core.Internal;

/// <summary>
/// Converts loosely-typed filter values (raw CLR objects, strings, or <see cref="JsonElement"/>s
/// produced by deserialization) into the strongly-typed value expected by a field.
/// </summary>
internal static class GridValueConverter
{
  /// <summary>
  /// Converts <paramref name="raw"/> to <paramref name="targetType"/> (which may be a
  /// <see cref="Nullable{T}"/>). Throws <see cref="GridValidationException"/> when conversion fails.
  /// </summary>
  public static object? Convert(object? raw, Type targetType, string field)
  {
    var underlying = TypeClassifier.UnwrapNullable(targetType);

    if (raw is null)
    {
      return null;
    }

    if (raw is JsonElement json)
    {
      if (json.ValueKind is JsonValueKind.Null)
      {
        return null;
      }

      raw = ExtractJson(json);
      if (raw is null)
      {
        return null;
      }
    }

    if (underlying.IsInstanceOfType(raw))
    {
      return raw;
    }

    try
    {
      return Coerce(raw, underlying);
    }
    catch (Exception ex) when (ex is FormatException or InvalidCastException or OverflowException or ArgumentException)
    {
      throw new GridValidationException(
        "invalid_value",
        $"Value '{raw}' is not valid for field '{field}' of type '{underlying.Name}'.");
    }
  }

  private static object? ExtractJson(JsonElement json)
  {
    return json.ValueKind switch
    {
      JsonValueKind.String => json.GetString(),
      JsonValueKind.Number => json.TryGetInt64(out var l) ? l : json.GetDecimal(),
      JsonValueKind.True => true,
      JsonValueKind.False => false,
      _ => json.ToString()
    };
  }

  private static object Coerce(object raw, Type underlying)
  {
    if (underlying.IsEnum)
    {
      if (raw is string enumText)
      {
        return Enum.Parse(underlying, enumText, ignoreCase: true);
      }

      return Enum.ToObject(underlying, System.Convert.ToInt64(raw, CultureInfo.InvariantCulture));
    }

    if (underlying == typeof(Guid))
    {
      return Guid.Parse(System.Convert.ToString(raw, CultureInfo.InvariantCulture)!);
    }

    if (underlying == typeof(DateTime))
    {
      return raw is string s
        ? DateTime.Parse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
        : System.Convert.ToDateTime(raw, CultureInfo.InvariantCulture);
    }

    if (underlying == typeof(DateTimeOffset))
    {
      return DateTimeOffset.Parse(System.Convert.ToString(raw, CultureInfo.InvariantCulture)!,
        CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
    }

    if (underlying == typeof(DateOnly))
    {
      return DateOnly.Parse(System.Convert.ToString(raw, CultureInfo.InvariantCulture)!, CultureInfo.InvariantCulture);
    }

    if (underlying == typeof(TimeOnly))
    {
      return TimeOnly.Parse(System.Convert.ToString(raw, CultureInfo.InvariantCulture)!, CultureInfo.InvariantCulture);
    }

    if (underlying == typeof(TimeSpan))
    {
      return TimeSpan.Parse(System.Convert.ToString(raw, CultureInfo.InvariantCulture)!, CultureInfo.InvariantCulture);
    }

    if (underlying == typeof(bool))
    {
      return raw is string boolText ? bool.Parse(boolText) : System.Convert.ToBoolean(raw, CultureInfo.InvariantCulture);
    }

    if (underlying == typeof(string))
    {
      return System.Convert.ToString(raw, CultureInfo.InvariantCulture)!;
    }

    return System.Convert.ChangeType(raw, underlying, CultureInfo.InvariantCulture);
  }
}
