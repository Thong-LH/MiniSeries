using MediatR;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Commands.ApproveLessonScript;

public sealed record ApproveLessonScriptCommand(
    Guid LessonId,
    string? EditedOverallScript = null) : IRequest<LessonDto>;
