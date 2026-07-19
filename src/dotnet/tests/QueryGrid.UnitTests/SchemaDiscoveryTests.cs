using QueryGrid.Abstractions;
using QueryGrid.Core.Schema;

namespace QueryGrid.UnitTests;

public class SchemaDiscoveryTests
{
  private static GridSchema Schema => GridSchemaProvider.GetSchema<Person>();

  [Fact]
  public void Discovers_scalar_properties_by_convention()
  {
    var names = Schema.Fields.Select(f => f.Name).ToHashSet();

    Assert.Contains("Id", names);
    Assert.Contains("Name", names);
    Assert.Contains("Age", names);
    Assert.Contains("Status", names);
    Assert.Contains("ExternalId", names);
    Assert.Contains("CreatedAt", names);
  }

  [Fact]
  public void Ignores_properties_marked_with_GridIgnore()
  {
    Assert.Null(Schema.Find("Secret"));
  }

  [Fact]
  public void Skips_unsupported_complex_types()
  {
    Assert.Null(Schema.Find("Tags"));
  }

  [Fact]
  public void Honors_sort_and_filter_opt_outs()
  {
    var sortDisabled = Schema.Require("SortDisabled");
    Assert.False(sortDisabled.CanSort);
    Assert.True(sortDisabled.CanFilter);

    var filterDisabled = Schema.Require("FilterDisabled");
    Assert.False(filterDisabled.CanFilter);
    Assert.True(filterDisabled.CanSort);
  }

  [Fact]
  public void Marks_only_annotated_string_fields_as_searchable()
  {
    var searchable = Schema.SearchableFields.Select(f => f.Name).OrderBy(n => n).ToArray();
    Assert.Equal(["Email", "ExternalId", "Name", "TrackingId"], searchable);
  }

  [Fact]
  public void Lookups_are_case_insensitive()
  {
    Assert.NotNull(Schema.Find("age"));
    Assert.NotNull(Schema.Find("AGE"));
  }

  [Fact]
  public void Infers_text_operators_for_strings()
  {
    var name = Schema.Require("Name");
    Assert.Contains(FilterOperator.Contains, name.AllowedOperators);
    Assert.DoesNotContain(FilterOperator.Lt, name.AllowedOperators);
  }

  [Fact]
  public void Infers_comparison_operators_for_numbers()
  {
    var age = Schema.Require("Age");
    Assert.Contains(FilterOperator.Lt, age.AllowedOperators);
    Assert.Contains(FilterOperator.Between, age.AllowedOperators);
    Assert.DoesNotContain(FilterOperator.Contains, age.AllowedOperators);
  }

  [Fact]
  public void Adds_null_operators_only_for_nullable_fields()
  {
    Assert.Contains(FilterOperator.IsNull, Schema.Require("DeletedAt").AllowedOperators);
    Assert.DoesNotContain(FilterOperator.IsNull, Schema.Require("Age").AllowedOperators);
    Assert.Contains(FilterOperator.IsNull, Schema.Require("OptionalStatus").AllowedOperators);
  }

  [Fact]
  public void Uses_Id_as_default_sort_tie_breaker_by_convention()
  {
    Assert.Equal("Id", Schema.SortTieBreakerField?.Name);
  }

  [Fact]
  public void Discovers_sort_extension_metadata()
  {
    var schema = GridSchemaProvider.GetSchema<SortExtensionsRow>();
    var status = schema.Require("Status");
    var receptionDate = schema.Require("ReceptionDate");
    var priority = schema.Require("PriorityLabel");

    Assert.Equal(3, status.EnumSortOrder!.Count);
    Assert.Equal(nameof(SortExtensionsRow.PriorityRank), priority.SortKeyProperty!.Name);
    Assert.Equal(["ReceptionTime"], receptionDate.SortCompanionNames);
  }
}
