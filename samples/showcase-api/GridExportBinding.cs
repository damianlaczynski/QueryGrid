using System.Text.Json;
using QueryGrid.Abstractions;
using QueryGrid.Abstractions.Serialization;

namespace QueryGrid.Samples.ShowcaseApi;

/// <summary>
/// Showcase JSON binding for <see cref="GridExportRequest"/> — copy or adapt in your API project.
/// </summary>
internal static class GridExportBinding
{
  public static async Task<(GridExportRequest? Request, string? ErrorMessage)> TryDeserializeAsync(
    Stream body,
    CancellationToken cancellationToken = default)
  {
    try
    {
      var request = await JsonSerializer.DeserializeAsync<GridExportRequest>(
        body,
        GridQueryBinding.JsonOptions,
        cancellationToken).ConfigureAwait(false);

      if (request is null)
      {
        return (null, "Request body is empty.");
      }

      request.Query ??= new GridQuery();
      request.Query.Sort ??= [];
      return (request, null);
    }
    catch (JsonException ex)
    {
      return (null, ex.Message);
    }
  }
}
