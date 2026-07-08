using MediatR;
using MiniSeries.Domain.Enums;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetMyLessons;

public sealed record GetMyLessonsResponse(
    IReadOnlyList<LessonSummaryDto> Items,
    int TotalCount);

public sealed record GetMyLessonsQuery(
    Guid UserId,
    int? Page = null,
    int? PageSize = null,
    ScriptStatus? ScriptStatus = null,
    OutputMode? OutputMode = null,
    string? Search = null) : IRequest<GetMyLessonsResponse>;
