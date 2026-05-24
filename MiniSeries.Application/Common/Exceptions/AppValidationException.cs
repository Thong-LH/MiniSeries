namespace MiniSeries.Application.Common.Exceptions;

public sealed class AppValidationException : Exception
{
    public AppValidationException(params string[] errors)
        : base("Validation failed.")
    {
        Errors = errors;
    }

    public IReadOnlyList<string> Errors { get; }
}
