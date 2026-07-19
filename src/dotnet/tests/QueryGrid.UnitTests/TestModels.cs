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

  [GridSearchable]
  public Guid ExternalId { get; set; }

  [GridSearchable]
  public Guid? TrackingId { get; set; }

  public DateOnly RegisteredOn { get; set; }

  public TimeOnly ShiftStart { get; set; }

  public TimeSpan SessionLength { get; set; }

  public DateTimeOffset UpdatedAt { get; set; }

  [GridIgnore]
  public string Secret { get; set; } = "top-secret";

  [GridSort(false)]
  public string SortDisabled { get; set; } = string.Empty;

  [GridFilter(false)]
  public string FilterDisabled { get; set; } = string.Empty;

  public List<string> Tags { get; set; } = [];

  public PersonStatus? OptionalStatus { get; set; }
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
      Status = PersonStatus.Active, ExternalId = Guid1, TrackingId = null,
      RegisteredOn = new DateOnly(2024, 1, 15), ShiftStart = new TimeOnly(9, 0),
      SessionLength = TimeSpan.FromHours(2), UpdatedAt = new DateTimeOffset(2024, 1, 1, 8, 0, 0, TimeSpan.Zero),
      OptionalStatus = PersonStatus.Active
    },
    new Person
    {
      Id = 2, Name = "Bob", Email = "bob@test.com", Age = 40, Salary = 7000m,
      IsActive = false, CreatedAt = new DateTime(2024, 6, 1), DeletedAt = new DateTime(2024, 7, 1),
      Status = PersonStatus.Pending, ExternalId = Guid2, TrackingId = null,
      RegisteredOn = new DateOnly(2024, 6, 1), ShiftStart = new TimeOnly(14, 30),
      SessionLength = TimeSpan.FromMinutes(90), UpdatedAt = new DateTimeOffset(2024, 6, 1, 12, 0, 0, TimeSpan.FromHours(2)),
      OptionalStatus = null
    },
    new Person
    {
      Id = 3, Name = "Charlie", Email = null, Age = 25, Salary = 4000m,
      IsActive = true, CreatedAt = new DateTime(2023, 12, 1), DeletedAt = null,
      Status = PersonStatus.Suspended, ExternalId = Guid3,
      TrackingId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
      RegisteredOn = new DateOnly(2023, 12, 10), ShiftStart = new TimeOnly(7, 45),
      SessionLength = TimeSpan.FromHours(1), UpdatedAt = new DateTimeOffset(2023, 12, 1, 6, 30, 0, TimeSpan.Zero),
      OptionalStatus = PersonStatus.Suspended
    },
    new Person
    {
      Id = 4, Name = "dave", Email = "dave@example.com", Age = 30, Salary = 6000m,
      IsActive = true, CreatedAt = new DateTime(2024, 3, 15), DeletedAt = null,
      Status = PersonStatus.Active, ExternalId = Guid4, TrackingId = null,
      RegisteredOn = new DateOnly(2024, 3, 15), ShiftStart = new TimeOnly(10, 15),
      SessionLength = TimeSpan.FromHours(3), UpdatedAt = new DateTimeOffset(2024, 3, 15, 9, 0, 0, TimeSpan.Zero),
      OptionalStatus = PersonStatus.Pending
    }
  ];

  public static IQueryable<Person> Query() => People().AsQueryable();
}

public sealed class TieBreakerRow
{
  public int Id { get; set; }

  public string Label { get; set; } = string.Empty;

  [GridSortTieBreaker]
  public int Code { get; set; }
}

public static class TieBreakerTestData
{
  public static List<TieBreakerRow> Rows() =>
  [
    new TieBreakerRow { Id = 1, Label = "B", Code = 2 },
    new TieBreakerRow { Id = 2, Label = "A", Code = 1 },
    new TieBreakerRow { Id = 3, Label = "A", Code = 3 },
  ];

  public static IQueryable<TieBreakerRow> Query() => Rows().AsQueryable();
}
