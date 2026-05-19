using MiniSeries.Domain.Enums;

namespace MiniSeries.Domain.Entities;

public class Chapter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public int Order { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string FullPrompt { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public string? MangaUrl { get; set; }
    public ChapterStatus Status { get; set; } = ChapterStatus.Draft;
}
