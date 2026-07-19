namespace QueryGrid.IntegrationTests;

public sealed class SqliteGridBehaviorTests
{
  [Fact]
  public async Task Empty_query_returns_first_page()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Empty_query_returns_first_page(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Search_is_trimmed_and_case_insensitive()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Search_is_trimmed_and_case_insensitive(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Text_contains_is_case_insensitive()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Text_contains_is_case_insensitive(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Enum_filter_accepts_padded_name()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Enum_filter_accepts_padded_name(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Nullable_enum_is_null_filter()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Nullable_enum_is_null_filter(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Nullable_string_whitespace_eq_matches_null_rows()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Nullable_string_whitespace_eq_matches_null_rows(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Enum_in_multiselect()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Enum_in_multiselect(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Custom_enum_sort_order()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Custom_enum_sort_order(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Sort_companion_date_and_time()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Sort_companion_date_and_time(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Sort_key_maps_display_field_to_rank()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Sort_key_maps_display_field_to_rank(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Skip_beyond_total_returns_empty_items_but_keeps_count()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Skip_beyond_total_returns_empty_items_but_keeps_count(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Or_filter_group_finds_either_value()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Or_filter_group_finds_either_value(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Field_names_are_case_insensitive()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Field_names_are_case_insensitive(host.Context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Filter_and_search_combine_with_and()
  {
    await using var host = await SqliteTestHost.CreateSeededAsync(TestContext.Current.CancellationToken);
    await GridBehaviorScenarios.Filter_and_search_combine_with_and(host.Context, TestContext.Current.CancellationToken);
  }
}
