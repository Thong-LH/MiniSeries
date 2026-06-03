using MediatR;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetMyLessons;

public sealed record GetMyLessonsQuery(Guid UserId) : IRequest<IReadOnlyList<LessonSummaryDto>>;
