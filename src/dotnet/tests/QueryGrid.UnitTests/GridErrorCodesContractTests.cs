using System.Reflection;
using System.Text.RegularExpressions;
using QueryGrid.Abstractions;

namespace QueryGrid.UnitTests;

public class GridErrorCodesContractTests
{
  private static readonly Regex SnakeCaseCode = new("^[a-z][a-z0-9_]*$", RegexOptions.Compiled);

  public static TheoryData<string, string> ValidationCodeMembers()
  {
    var data = new TheoryData<string, string>();
    foreach (var field in typeof(GridValidationCodes).GetFields(BindingFlags.Public | BindingFlags.Static))
    {
      if (field.FieldType == typeof(string))
      {
        data.Add(field.Name, (string)field.GetValue(null)!);
      }
    }

    return data;
  }

  public static TheoryData<string, string> TransportCodeMembers()
  {
    var data = new TheoryData<string, string>();
    foreach (var field in typeof(GridTransportErrorCodes).GetFields(BindingFlags.Public | BindingFlags.Static))
    {
      if (field.FieldType == typeof(string))
      {
        data.Add(field.Name, (string)field.GetValue(null)!);
      }
    }

    return data;
  }

  [Theory]
  [MemberData(nameof(ValidationCodeMembers))]
  public void Validation_codes_are_stable_snake_case(string _, string code)
  {
    Assert.Matches(SnakeCaseCode, code);
    Assert.False(string.IsNullOrWhiteSpace(code));
  }

  [Theory]
  [MemberData(nameof(TransportCodeMembers))]
  public void Transport_codes_are_stable_snake_case(string _, string code)
  {
    Assert.Matches(SnakeCaseCode, code);
    Assert.False(string.IsNullOrWhiteSpace(code));
  }

  [Fact]
  public void Validation_codes_match_expected_contract_set()
  {
    var codes = typeof(GridValidationCodes)
      .GetFields(BindingFlags.Public | BindingFlags.Static)
      .Where(field => field.FieldType == typeof(string))
      .Select(field => (string)field.GetValue(null)!)
      .OrderBy(code => code)
      .ToArray();

    string[] expected =
    [
      GridValidationCodes.FieldNotFilterable,
      GridValidationCodes.FieldNotSortable,
      GridValidationCodes.FilterTooDeep,
      GridValidationCodes.InListTooLong,
      GridValidationCodes.InvalidFilter,
      GridValidationCodes.InvalidValue,
      GridValidationCodes.OperatorNotAllowed,
      GridValidationCodes.OperatorNotSupported,
      GridValidationCodes.PageTooLarge,
      GridValidationCodes.TooManyConditions,
      GridValidationCodes.TooManySorts,
      GridValidationCodes.UnknownField,
    ];

    Assert.Equal(expected, codes);
  }
}
