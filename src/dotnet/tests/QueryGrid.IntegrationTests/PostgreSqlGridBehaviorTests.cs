namespace QueryGrid.IntegrationTests;

[Collection(nameof(PostgreSqlCollection))]
public sealed class PostgreSqlGridBehaviorTests(PostgreSqlFixture fixture) : PostgreSqlTestBase(fixture)
{
  private async Task<SearchTestDbContext> CreateSeededContextAsync()
  {
    var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);
    await SearchTestData.SeedAppointmentsAsync(context);
    return context;
  }

  [Fact]
  public async Task Empty_query_returns_first_page()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Empty_query_returns_first_page(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Search_is_trimmed_and_case_insensitive()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Search_is_trimmed_and_case_insensitive(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Text_contains_is_case_insensitive()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Text_contains_is_case_insensitive(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Enum_filter_accepts_padded_name()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Enum_filter_accepts_padded_name(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Nullable_enum_is_null_filter()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Nullable_enum_is_null_filter(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Nullable_string_whitespace_eq_matches_null_rows()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Nullable_string_whitespace_eq_matches_null_rows(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Enum_in_multiselect()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Enum_in_multiselect(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Custom_enum_sort_order()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Custom_enum_sort_order(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Sort_companion_date_and_time()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Sort_companion_date_and_time(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Sort_key_maps_display_field_to_rank()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Sort_key_maps_display_field_to_rank(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Skip_beyond_total_returns_empty_items_but_keeps_count()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Skip_beyond_total_returns_empty_items_but_keeps_count(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Or_filter_group_finds_either_value()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Or_filter_group_finds_either_value(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Field_names_are_case_insensitive()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Field_names_are_case_insensitive(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Filter_and_search_combine_with_and()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Filter_and_search_combine_with_and(context, TestContext.Current.CancellationToken);
  }

  [Fact]
  public async Task Guid_search_matches_by_fragment()
  {
    await using var context = await CreateSeededContextAsync();
    await GridBehaviorScenarios.Guid_search_matches_by_fragment(context, TestContext.Current.CancellationToken);
  }
}
