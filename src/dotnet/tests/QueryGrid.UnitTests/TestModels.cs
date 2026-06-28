using QueryGrid.Abstractions;

namespace QueryGrid.UnitTests;

public enum PersonStatus
{
  Pending,
  Active,
  Suspended
}

public sealed class Person
{
  public int Id { get; set; }

  [GridSearchable]
  public string Name { get; set; } = string.Empty;

  [GridSearchable]
  public string? Email { get; set; }

  public int Age { get; set; }

  public decimal Salary { get; set; }

  public bool IsActive { get; set; }

  public DateTime CreatedAt { get; set; }

  public DateTime? DeletedAt { get; set; }

  public PersonStatus Status { get; set; }

  public Guid ExternalId { get; set; }

  [GridIgnore]
  public string Secret { get; set; } = "top-secret";

  [GridSort(false)]
  public string SortDisabled { get; set; } = string.Empty;

  [GridFilter(false)]
  public string FilterDisabled { get; set; } = string.Empty;

  public List<string> Tags { get; set; } = [];
}

public static class TestData
{
  public static readonly Guid Guid1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
  public static readonly Guid Guid2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
  public static readonly Guid Guid3 = Guid.Parse("33333333-3333-3333-3333-333333333333");
  public static readonly Guid Guid4 = Guid.Parse("44444444-4444-4444-4444-444444444444");

  public static List<Person> People() =>
  [
    new Person
    {
      Id = 1, Name = "Alice", Email = "alice@example.com", Age = 30, Salary = 5000m,
      IsActive = true, CreatedAt = new DateTime(2024, 1, 1), DeletedAt = null,
      Status = PersonStatus.Active, ExternalId = Guid1
    },
    new Person
    {
      Id = 2, Name = "Bob", Email = "bob@test.com", Age = 40, Salary = 7000m,
      IsActive = false, CreatedAt = new DateTime(2024, 6, 1), DeletedAt = new DateTime(2024, 7, 1),
      Status = PersonStatus.Pending, ExternalId = Guid2
    },
    new Person
    {
      Id = 3, Name = "Charlie", Email = null, Age = 25, Salary = 4000m,
      IsActive = true, CreatedAt = new DateTime(2023, 12, 1), DeletedAt = null,
      Status = PersonStatus.Suspended, ExternalId = Guid3
    },
    new Person
    {
      Id = 4, Name = "dave", Email = "dave@example.com", Age = 35, Salary = 6000m,
      IsActive = true, CreatedAt = new DateTime(2024, 3, 15), DeletedAt = null,
      Status = PersonStatus.Active, ExternalId = Guid4
    }
  ];

  public static IQueryable<Person> Query() => People().AsQueryable();
}
