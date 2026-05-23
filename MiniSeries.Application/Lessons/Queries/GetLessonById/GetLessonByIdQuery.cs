using MediatR;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetLessonById;

public sealed record GetLessonByIdQuery(Guid LessonId) : IRequest<LessonDto?>;
