using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record LessonSummaryDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    string Title,
    string? ThumbnailUrl,
    OutputMode OutputMode,
    ScriptStatus ScriptStatus,
    int ChapterCount,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ApprovedAt)
{
    public static LessonSummaryDto FromEntity(Lesson lesson)
    {
        return new LessonSummaryDto(
            lesson.Id,
            lesson.UserId,
            lesson.UserEmail,
            lesson.Title,
            ResolveThumbnailUrl(lesson),
            lesson.OutputMode,
            lesson.ScriptStatus,
            lesson.Chapters.Count,
            lesson.CreatedAt,
            lesson.UpdatedAt,
            lesson.ApprovedAt);
    }

    private static string? ResolveThumbnailUrl(Lesson lesson)
    {
        if (!string.IsNullOrWhiteSpace(lesson.AnchorImageUrl))
        {
            return lesson.AnchorImageUrl;
        }

        return lesson.Chapters
            .OrderBy(chapter => chapter.Order)
            .Select(chapter => chapter.MangaUrl)
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));
    }
}
