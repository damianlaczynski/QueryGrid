namespace QueryGrid.Core.Internal;

/// <summary>
/// Broad classification of a field's CLR type, used to infer which operators are valid
/// and how raw values are converted.
/// </summary>
internal enum FieldCategory
{
  Text,
  Number,
  Boolean,
  DateTime,
  Enum,
  Guid
}
