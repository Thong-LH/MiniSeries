using MediatR;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Commands.ReviewLessonScript;

public sealed record ReviewLessonScriptCommand(
    Guid LessonId,
    string Feedback) : IRequest<LessonDto>;
