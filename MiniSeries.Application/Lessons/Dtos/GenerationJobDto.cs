using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record GenerationJobDto(
    Guid Id,
    Guid LessonId,
    GenerationJobType Type,
    GenerationJobStatus Status,
    string CurrentStep,
    string? ErrorMessage,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    IReadOnlyList<GenerationLogDto> Logs)
{
    public static GenerationJobDto FromEntity(GenerationJob job)
    {
        return new GenerationJobDto(
            job.Id,
            job.LessonId,
            job.Type,
            job.Status,
            job.CurrentStep,
            job.ErrorMessage,
            job.CreatedAt,
            job.StartedAt,
            job.CompletedAt,
            job.Logs
                .OrderBy(log => log.CreatedAt)
                .Select(GenerationLogDto.FromEntity)
                .ToList());
    }
}
