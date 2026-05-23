using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Dtos;

public sealed record GenerationLogDto(
    Guid Id,
    Guid GenerationJobId,
    GenerationLogLevel Level,
    string Step,
    string Message,
    string? PayloadJson,
    DateTime CreatedAt)
{
    public static GenerationLogDto FromEntity(GenerationLog log)
    {
        return new GenerationLogDto(
            log.Id,
            log.GenerationJobId,
            log.Level,
            log.Step,
            log.Message,
            log.PayloadJson,
            log.CreatedAt);
    }
}
