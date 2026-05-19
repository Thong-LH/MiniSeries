namespace MiniSeries.Application.Common.Models;

public sealed class ChapterDraftResult
{
    public required string RawJson { get; init; }
    public required IReadOnlyList<ChapterDraftItem> Chapters { get; init; }
}

public sealed class ChapterDraftItem
{
    public required int Order { get; init; }
    public required string Summary { get; init; }
    public required string FullPrompt { get; init; }
}
