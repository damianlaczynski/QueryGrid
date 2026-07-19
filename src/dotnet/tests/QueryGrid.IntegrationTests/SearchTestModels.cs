using Microsoft.EntityFrameworkCore;
using QueryGrid.Abstractions;

namespace QueryGrid.IntegrationTests;

public sealed class Role
{
  public int Id { get; set; }

  public string Name { get; set; } = string.Empty;

  public string? Description { get; set; }

  public bool IsSystem { get; set; }

  public ICollection<RolePermission> Permissions { get; set; } = [];
}

public sealed class RolePermission
{
  public int Id { get; set; }

  public int RoleId { get; set; }

  public Role Role { get; set; } = null!;
}

public sealed class AppUser
{
  public int Id { get; set; }

  public string Name { get; set; } = string.Empty;

  public ICollection<UserRole> Roles { get; set; } = [];
}

public sealed class UserRole
{
  public int UserId { get; set; }

  public int RoleId { get; set; }

  public AppUser User { get; set; } = null!;

  public Role Role { get; set; } = null!;
}

public sealed class Issue
{
  public Guid Id { get; set; }

  public string Title { get; set; } = string.Empty;

  public string? Description { get; set; }

  public int CreatedBy { get; set; }
}

public sealed class RoleListItemDto
{
  public int Id { get; init; }

  [GridSearchable]
  public string Name { get; init; } = string.Empty;

  [GridSearchable]
  public string? Description { get; init; }

  public int PermissionCount { get; init; }

  public int UserCount { get; init; }

  public bool IsSystem { get; init; }
}

public sealed class IssueListItemDto
{
  [GridSearchable]
  public Guid Id { get; init; }

  [GridSearchable]
  public string Title { get; init; } = string.Empty;

  [GridSearchable]
  public string? Description { get; init; }

  public string? CreatedByName { get; init; }
}

public sealed class SearchTestDbContext(DbContextOptions<SearchTestDbContext> options) : DbContext(options)
{
  public DbSet<Role> Roles => Set<Role>();

  public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

  public DbSet<AppUser> Users => Set<AppUser>();

  public DbSet<UserRole> UserRoles => Set<UserRole>();

  public DbSet<Issue> Issues => Set<Issue>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
  }
}

public static class SearchTestData
{
  public static readonly Guid IssueId1 = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-111111111111");
  public static readonly Guid IssueId2 = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-222222222222");

  public static async Task SeedAsync(SearchTestDbContext context)
  {
    if (await context.Roles.AnyAsync())
    {
      return;
    }

    var admin = new Role
    {
      Id = 1,
      Name = "Admin",
      Description = "Full access role",
      IsSystem = true,
      Permissions = [new RolePermission { Id = 1 }, new RolePermission { Id = 2 }],
    };

    var viewer = new Role
    {
      Id = 2,
      Name = "Viewer",
      Description = "Read-only access",
      IsSystem = false,
      Permissions = [new RolePermission { Id = 3 }],
    };

    context.Roles.AddRange(admin, viewer);
    context.Users.AddRange(
      new AppUser { Id = 1, Name = "Alice" },
      new AppUser { Id = 2, Name = "Bob" });
    context.UserRoles.AddRange(
      new UserRole { UserId = 1, RoleId = 1 },
      new UserRole { UserId = 2, RoleId = 1 },
      new UserRole { UserId = 2, RoleId = 2 });
    context.Issues.AddRange(
      new Issue
      {
        Id = IssueId1,
        Title = "Broken login",
        Description = "Users cannot sign in",
        CreatedBy = 1,
      },
      new Issue
      {
        Id = IssueId2,
        Title = "Dashboard polish",
        Description = "Improve layout spacing",
        CreatedBy = 2,
      });

    await context.SaveChangesAsync();
  }
}
