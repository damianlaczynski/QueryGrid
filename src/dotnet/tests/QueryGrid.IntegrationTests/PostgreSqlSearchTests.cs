using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;
using QueryGrid.Core;
using QueryGrid.EntityFrameworkCore;

namespace QueryGrid.IntegrationTests;

public sealed class PostgreSqlSearchTests(PostgreSqlFixture fixture) : PostgreSqlTestBase(fixture)
{
  [Fact]
  public async Task Simple_projection_search_matches_string_field()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "login" },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal("Broken login", result.Items[0].Title);
  }

  [Fact]
  public async Task Correlated_projection_search_matches_description()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Roles.AsNoTracking()
      .Select(r => new RoleListItemDto
      {
        Id = r.Id,
        Name = r.Name,
        Description = r.Description,
        PermissionCount = r.Permissions.Count,
        UserCount = context.Users.Count(u => u.Roles.Any(ur => ur.RoleId == r.Id)),
        IsSystem = r.IsSystem,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "read-only" },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal("Viewer", result.Items[0].Name);
  }

  [Fact]
  public async Task Correlated_issue_projection_search_matches_title()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = context.Users
          .Where(u => u.Id == i.CreatedBy)
          .Select(u => u.Name)
          .FirstOrDefault(),
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "dashboard" },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal("Dashboard polish", result.Items[0].Title);
    Assert.Equal("Bob", result.Items[0].CreatedByName);
  }

  [Fact]
  public async Task Guid_search_with_fragment_matches_equality()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "dddd-1111" },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal(SearchTestData.IssueId1, result.Items[0].Id);
  }

  [Fact]
  public async Task Guid_search_with_plain_text_skips_guid_field()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = "not-a-guid" },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Empty(result.Items);
  }

  [Fact]
  public async Task Guid_search_with_valid_guid_matches_equality()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var projected = context.Issues.AsNoTracking()
      .Select(i => new IssueListItemDto
      {
        Id = i.Id,
        Title = i.Title,
        Description = i.Description,
        CreatedByName = null,
      });

    var result = await projected.ToGridResultAsync(
      new GridQuery { Take = 10, Search = SearchTestData.IssueId1.ToString() },
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal(SearchTestData.IssueId1, result.Items[0].Id);
  }

  [Fact]
  public async Task ApplyEntitySearch_before_projection_matches_on_entity()
  {
    await using var context = await CreateContextAsync();
    await SearchTestData.SeedAsync(context);

    var query = new GridQuery { Take = 10, Search = "read-only" };
    var projected = context.Roles.AsNoTracking()
      .ApplyEntitySearch(query.Search, r => r.Name, r => r.Description)
      .Select(r => new RoleListItemDto
      {
        Id = r.Id,
        Name = r.Name,
        Description = r.Description,
        PermissionCount = r.Permissions.Count,
        UserCount = context.Users.Count(u => u.Roles.Any(ur => ur.RoleId == r.Id)),
        IsSystem = r.IsSystem,
      });

    var result = await projected.ToGridResultAsync(
      query.WithoutSearch(),
      cancellationToken: TestContext.Current.CancellationToken);

    Assert.Single(result.Items);
    Assert.Equal("Viewer", result.Items[0].Name);
  }
}
