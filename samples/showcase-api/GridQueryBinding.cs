using System.Text.Json;
using QueryGrid.Abstractions;
using QueryGrid.Abstractions.Serialization;

namespace QueryGrid.Samples.ShowcaseApi;

/// <summary>
/// Showcase JSON binding for <see cref="GridQuery"/> — copy or adapt in your API project.
/// Query param name follows the FastEndpoints convention (<c>public GridQuery Grid</c> → <c>?grid=</c>).
/// </summary>
internal static class GridQueryBinding
{
  public const string GridQueryParameter = "grid";

  public static JsonSerializerOptions JsonOptions { get; } = GridQueryJson.CreateOptions();

  public static bool TryDeserialize(string? json, out GridQuery? query, out string? errorMessage)
  {
    query = null;
    errorMessage = null;

    if (string.IsNullOrWhiteSpace(json))
    {
      query = new GridQuery();
      query.Sort ??= [];
      return true;
    }

    try
    {
      query = JsonSerializer.Deserialize<GridQuery>(json, JsonOptions) ?? new GridQuery();
      query.Sort ??= [];
      return true;
    }
    catch (JsonException ex)
    {
      errorMessage = ex.Message;
      return false;
    }
  }

  /// <summary>For FastEndpoints: binds from <c>?grid=</c> via <see cref="GridQuery.TryParse"/> — no app registration.</summary>
  public static bool TryParse(string? value, out GridQuery result)
    => GridQuery.TryParse(value, out result);
}
