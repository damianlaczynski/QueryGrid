using System.Linq.Expressions;
using System.Reflection;
using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.Core.Internal;

internal static class GridExportExecutor
{
  private static readonly MethodInfo EnumerableContains = typeof(Enumerable)
    .GetMethods(BindingFlags.Static | BindingFlags.Public)
    .Single(method =>
      method.Name == nameof(Enumerable.Contains) &&
      method.GetParameters().Length == 2);

  internal readonly record struct GridExportPlan<T>(
    IQueryable<T> FilteredQuery,
    IQueryable<T> ExportQuery,
    IReadOnlyList<SortDescriptor> EffectiveSort,
    IReadOnlyList<GridFieldInfo> ExportFields);

  public static GridExportPlan<T> Plan<T>(
    IQueryable<T> source,
    GridExportRequest request,
    GridOptions gridOptions,
    GridExportOptions exportOptions)
  {
    ArgumentNullException.ThrowIfNull(source);
    ArgumentNullException.ThrowIfNull(request);
    ArgumentNullException.ThrowIfNull(request.Query);

    ValidateRequest(request, exportOptions);

    var schema = GridSchemaProvider.GetSchema<T>();
    var exportFields = ResolveExportFields(request.Columns, schema);
    var query = request.Query;
    query.Sort ??= [];

    var filtered = source.ApplyGridFilterAndSearch(query, gridOptions);

    if (request.Scope == GridExportScope.SelectedKeys)
    {
      filtered = ApplySelectedKeysFilter(filtered, request, schema, exportOptions);
    }

    var effectiveSort = SortExpressionBuilder.ResolveEffectiveSort(query.Sort, schema, gridOptions);
    var exportQuery = SortExpressionBuilder.ApplyEffective(filtered, effectiveSort, schema)
      .Take(exportOptions.MaxExportRows);

    return new GridExportPlan<T>(filtered, exportQuery, effectiveSort, exportFields);
  }

  private static void ValidateRequest(GridExportRequest request, GridExportOptions exportOptions)
  {
    if (request.Columns is null || request.Columns.Count == 0)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportColumnsRequired,
        "At least one export column is required.");
    }

    if (request.Scope != GridExportScope.SelectedKeys)
    {
      return;
    }

    var keys = request.SelectedKeys;
    if (keys is null || keys.Length == 0)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportSelectionRequired,
        "Selected keys are required when export scope is 'selectedKeys'.");
    }

    if (keys.Length > exportOptions.MaxSelectedKeys)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportSelectionTooLarge,
        $"Selected key count {keys.Length} exceeds the maximum of {exportOptions.MaxSelectedKeys}.");
    }
  }

  private static IReadOnlyList<GridFieldInfo> ResolveExportFields(
    IEnumerable<GridExportColumn> columns,
    GridSchema schema)
  {
    var fields = new List<GridFieldInfo>();
    foreach (var column in columns)
    {
      fields.Add(schema.Require(column.Field));
    }

    return fields;
  }

  private static IQueryable<T> ApplySelectedKeysFilter<T>(
    IQueryable<T> source,
    GridExportRequest request,
    GridSchema schema,
    GridExportOptions exportOptions)
  {
    var keys = request.SelectedKeys!;
    if (keys.Length > exportOptions.MaxSelectedKeys)
    {
      throw new GridValidationException(
        GridValidationCodes.ExportSelectionTooLarge,
        $"Selected key count {keys.Length} exceeds the maximum of {exportOptions.MaxSelectedKeys}.");
    }

    var field = schema.Require(request.DataKeyField);
    var parameter = Expression.Parameter(typeof(T), "row");
    var member = Expression.Property(parameter, field.Property);
    var constants = keys
      .Select(key => Expression.Constant(
        GridValueConverter.Convert(key, field.ClrType, field.Name),
        field.ClrType))
      .ToArray();
    var arrayExpression = Expression.NewArrayInit(field.ClrType, constants);
    var containsMethod = EnumerableContains.MakeGenericMethod(field.ClrType);
    var containsCall = Expression.Call(containsMethod, arrayExpression, member);
    var lambda = Expression.Lambda<Func<T, bool>>(containsCall, parameter);
    return source.Where(lambda);
  }
}
