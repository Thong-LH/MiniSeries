namespace MiniSeries.Application.Common.Models;

public sealed class ScriptDraftResult
{
    public required string RawJson { get; init; }
    public required string CharacterProfile { get; init; }
    public required string OverallScript { get; init; }
}
