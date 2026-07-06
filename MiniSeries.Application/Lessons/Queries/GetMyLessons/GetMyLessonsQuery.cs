using MediatR;
using MiniSeries.Domain.Enums;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetMyLessons;

public sealed record GetMyLessonsQuery(
    Guid UserId,
    int? Page = null,
    int? PageSize = null,
    ScriptStatus? ScriptStatus = null,
    OutputMode? OutputMode = null,
    string? Search = null) : IRequest<IReadOnlyList<LessonSummaryDto>>;
