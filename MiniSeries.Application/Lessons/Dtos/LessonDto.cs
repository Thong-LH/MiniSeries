using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record LessonDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    string Title,
    string RawContent,
    CreativeMode CreativeMode,
    string? CreativeBrief,
    OutputMode OutputMode,
    ScriptStatus ScriptStatus,
    string CharacterProfile,
    string OverallScript,
    string AnchorImageUrl,
    IReadOnlyList<ChapterDto> Chapters,
    IReadOnlyList<LlmJsonDto> LlmJsons,
    IReadOnlyList<GenerationJobDto> GenerationJobs,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ApprovedAt)
{
    public static LessonDto FromEntity(Lesson lesson)
    {
        return new LessonDto(
            lesson.Id,
            lesson.UserId,
            lesson.UserEmail,
            lesson.Title,
            lesson.RawContent,
            lesson.CreativeMode,
            lesson.CreativeBrief,
            lesson.OutputMode,
            lesson.ScriptStatus,
            lesson.CharacterProfile,
            lesson.OverallScript,
            lesson.AnchorImageUrl,
            lesson.Chapters
                .OrderBy(chapter => chapter.Order)
                .Select(ChapterDto.FromEntity)
                .ToList(),
            lesson.LlmJsons
                .OrderBy(llmJson => llmJson.CreatedAt)
                .Select(LlmJsonDto.FromEntity)
                .ToList(),
            lesson.GenerationJobs
                .OrderBy(job => job.CreatedAt)
                .Select(GenerationJobDto.FromEntity)
                .ToList(),
            lesson.CreatedAt,
            lesson.UpdatedAt,
            lesson.ApprovedAt);
    }
}
