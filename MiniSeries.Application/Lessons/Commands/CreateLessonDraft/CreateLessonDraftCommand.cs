using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.CreateLessonDraft;

public sealed record CreateLessonDraftCommand(
    string RawContent,
    string Title,
    bool GenerateVideo,
    CreativeMode CreativeMode,
    string? CreativeBrief) : IRequest<Lesson>;
