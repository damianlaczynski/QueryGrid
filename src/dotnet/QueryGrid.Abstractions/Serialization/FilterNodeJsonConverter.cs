using System.Text.Json;
using System.Text.Json.Serialization;

namespace QueryGrid.Abstractions.Serialization;

/// <summary>
/// Serializes <see cref="FilterNode"/> as either a <see cref="FilterCondition"/> or <see cref="FilterGroup"/>
/// without a type discriminator, matching the JSON shape used by the transport layer.
/// </summary>
public sealed class FilterNodeJsonConverter : JsonConverter<FilterNode>
{
  /// <inheritdoc />
  public override FilterNode? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
  {
    using var document = JsonDocument.ParseValue(ref reader);
    var root = document.RootElement;

    if (root.ValueKind is JsonValueKind.Null)
    {
      return null;
    }

    if (root.TryGetProperty("logic", out _) || root.TryGetProperty("conditions", out _))
    {
      return root.Deserialize<FilterGroup>(options);
    }

    return root.Deserialize<FilterCondition>(options);
  }

  /// <inheritdoc />
  public override void Write(Utf8JsonWriter writer, FilterNode value, JsonSerializerOptions options)
  {
    switch (value)
    {
      case FilterGroup group:
        JsonSerializer.Serialize(writer, group, options);
        break;
      case FilterCondition condition:
        JsonSerializer.Serialize(writer, condition, options);
        break;
      default:
        JsonSerializer.Serialize(writer, value, value.GetType(), options);
        break;
    }
  }
}
