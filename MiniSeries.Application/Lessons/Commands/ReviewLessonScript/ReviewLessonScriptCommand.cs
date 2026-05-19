using MiniSeries.Domain.Entities;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.ReviewLessonScript;

public sealed record ReviewLessonScriptCommand(
    Guid LessonId,
    string Feedback) : IRequest<Lesson>;
