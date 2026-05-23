using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record ChapterDto(
    Guid Id,
    Guid LessonId,
    int Order,
    string Summary,
    string FullPrompt,
    string? VideoUrl,
    string? MangaUrl,
    ChapterStatus Status)
{
    public static ChapterDto FromEntity(Chapter chapter)
    {
        return new ChapterDto(
            chapter.Id,
            chapter.LessonId,
            chapter.Order,
            chapter.Summary,
            chapter.FullPrompt,
            chapter.VideoUrl,
            chapter.MangaUrl,
            chapter.Status);
    }
}
