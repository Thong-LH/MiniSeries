using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record LlmJsonDto(
    Guid Id,
    Guid LessonId,
    LlmJsonPurpose Purpose,
    string Provider,
    string Model,
    string RawJson,
    string? Feedback,
    DateTime CreatedAt)
{
    public static LlmJsonDto FromEntity(LlmJson llmJson)
    {
        return new LlmJsonDto(
            llmJson.Id,
            llmJson.LessonId,
            llmJson.Purpose,
            llmJson.Provider,
            llmJson.Model,
            llmJson.RawJson,
            llmJson.Feedback,
            llmJson.CreatedAt);
    }
}
