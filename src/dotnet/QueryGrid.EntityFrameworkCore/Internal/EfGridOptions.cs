using Microsoft.EntityFrameworkCore.Infrastructure;
using QueryGrid.Core;
using QueryGrid.Core.Internal;

namespace QueryGrid.EntityFrameworkCore.Internal;

internal static class EfGridOptions
{
  public static GridOptions WithProviderSearch<T>(IQueryable<T> source, GridOptions? options)
  {
    options ??= GridOptions.Default;
    if (options.SearchMatchBuilder is not null)
    {
      return options;
    }

    if (source.Provider is not IInfrastructure<IServiceProvider> infrastructure)
    {
      return options;
    }

    var context = infrastructure.GetService<ICurrentDbContext>()?.Context;
    if (context?.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL"
        && NpgsqlILikeSearchMatchBuilder.IsAvailable)
    {
      return options.CloneWithSearchMatchBuilder(NpgsqlILikeSearchMatchBuilder.Instance);
    }

    return options;
  }
}
