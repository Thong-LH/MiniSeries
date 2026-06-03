using MediatR;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Commands.CreateLessonDraft;

public sealed record CreateLessonDraftCommand(
    string RawContent,
    string Title,
    bool GenerateVideo,
    CreativeMode CreativeMode,
    string? CreativeBrief) : IRequest<LessonDto>
{
    public Guid UserId { get; init; }
    public string? UserEmail { get; init; }
}
