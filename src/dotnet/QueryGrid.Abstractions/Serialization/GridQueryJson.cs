using System.Text.Json;
using System.Text.Json.Serialization;

namespace QueryGrid.Abstractions.Serialization;

/// <summary>Shared JSON serializer options for <see cref="GridQuery"/> transport.</summary>
public static class GridQueryJson
{
  /// <summary>Returns serializer options for grid query JSON (camelCase, filter converter, enum strings).</summary>
  public static JsonSerializerOptions CreateOptions()
  {
    return new JsonSerializerOptions
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
      PropertyNameCaseInsensitive = true,
      DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
      Converters =
      {
        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
        new FilterNodeJsonConverter()
      }
    };
  }

  /// <summary>Serializes a <see cref="GridQuery"/> using <see cref="CreateOptions"/>.</summary>
  public static string Serialize(GridQuery query)
    => JsonSerializer.Serialize(query, CreateOptions());
}
