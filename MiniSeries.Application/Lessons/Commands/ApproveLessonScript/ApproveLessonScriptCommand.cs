using MiniSeries.Domain.Entities;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.ApproveLessonScript;

public sealed record ApproveLessonScriptCommand(Guid LessonId) : IRequest<Lesson>;
