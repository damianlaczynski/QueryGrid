namespace QueryGrid.Abstractions;

/// <summary>
/// Thrown when a <see cref="GridQuery"/> is rejected: an unknown or disallowed field, an operator
/// that is invalid for the field's type, a value that cannot be converted, or a configured limit
/// (filter depth, condition count, list length, page size) being exceeded.
/// </summary>
public sealed class GridValidationException : Exception
{
  /// <summary>A stable machine-readable code identifying the kind of validation failure.</summary>
  public string Code { get; }

  /// <summary>Creates the exception.</summary>
  /// <param name="code">A stable machine-readable error code.</param>
  /// <param name="message">A human-readable description of the failure.</param>
  public GridValidationException(string code, string message)
    : base(message)
  {
    Code = code;
  }
}
