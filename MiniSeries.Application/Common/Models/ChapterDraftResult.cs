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
    public required ChapterQuizDraftItem Quiz { get; init; }
}

public sealed class ChapterQuizDraftItem
{
    public required string Question { get; init; }
    public required string OptionA { get; init; }
    public required string OptionB { get; init; }
    public required string OptionC { get; init; }
    public required string OptionD { get; init; }
    public required string CorrectOption { get; init; }
    public required string Explanation { get; init; }
}
