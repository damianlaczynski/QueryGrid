using System.Text.Json;
using QueryGrid.Abstractions;
using QueryGrid.Abstractions.Serialization;
using QueryGrid.Core;

namespace QueryGrid.UnitTests;

public class GridQueryContractTests
{
  private static readonly JsonSerializerOptions JsonOptions = GridQueryJson.CreateOptions();

  [Fact]
  public void Roundtrip_preserves_query()
  {
    var original = new GridQuery
    {
      Skip = 10,
      Take = 25,
      Search = "alice",
      Sort = [new SortDescriptor("Name", desc: true)],
      Filter = new FilterCondition { Field = "Age", Operator = FilterOperator.Gte, Value = 18 }
    };

    var json = JsonSerializer.Serialize(original, JsonOptions);
    var deserialized = JsonSerializer.Deserialize<GridQuery>(json, JsonOptions)!;

    Assert.Equal(10, deserialized.Skip);
    Assert.Equal(25, deserialized.Take);
    Assert.Equal("alice", deserialized.Search);
    Assert.Single(deserialized.Sort);
    Assert.Equal("Name", deserialized.Sort[0].Field);
    Assert.True(deserialized.Sort[0].Desc);
    var condition = Assert.IsType<FilterCondition>(deserialized.Filter);
    Assert.Equal(FilterOperator.Gte, condition.Operator);
  }

  [Fact]
  public void Serialize_uses_camelCase_string_enum_values()
  {
    var json = JsonSerializer.Serialize(new GridQuery
    {
      Filter = new FilterCondition { Field = "Age", Operator = FilterOperator.Gte, Value = 1 }
    }, JsonOptions);

    Assert.Contains("\"operator\":\"gte\"", json, StringComparison.Ordinal);
  }

  [Fact]
  public void Filter_group_roundtrips_without_type_discriminator()
  {
    var original = new GridQuery
    {
      Filter = new FilterGroup
      {
        Logic = FilterLogic.And,
        Conditions =
        [
          new FilterCondition { Field = "Age", Operator = FilterOperator.Gte, Value = 18 },
          new FilterCondition { Field = "IsActive", Operator = FilterOperator.Eq, Value = true }
        ]
      }
    };

    var json = JsonSerializer.Serialize(original, JsonOptions);
    var deserialized = JsonSerializer.Deserialize<GridQuery>(json, JsonOptions)!;
    var group = Assert.IsType<FilterGroup>(deserialized.Filter);
    Assert.Equal(FilterLogic.And, group.Logic);
    Assert.Equal(2, group.Conditions.Count);
  }
}
