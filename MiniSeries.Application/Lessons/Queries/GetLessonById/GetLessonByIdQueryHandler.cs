using MediatR;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetLessonById;

public sealed class GetLessonByIdQueryHandler(ILessonRepository lessonRepository)
    : IRequestHandler<GetLessonByIdQuery, LessonDto?>
{
    public async Task<LessonDto?> Handle(GetLessonByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.LessonId == Guid.Empty)
        {
            throw new AppValidationException("LessonId is required.");
        }

        var lesson = await lessonRepository.GetByIdAsync(request.LessonId);
        return lesson is null ? null : LessonDto.FromEntity(lesson);
    }
}
