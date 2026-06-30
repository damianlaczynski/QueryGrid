using System.Text.Json;
using System.Text.Json.Serialization;

namespace QueryGrid.Abstractions.Serialization;

/// <summary>Shared JSON serializer options for <see cref="GridQuery"/> transport.</summary>
public static class GridQueryJson
{
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
}
