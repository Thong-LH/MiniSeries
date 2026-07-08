using MediatR;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetMyLessons;

public sealed class GetMyLessonsQueryHandler(ILessonRepository lessonRepository)
    : IRequestHandler<GetMyLessonsQuery, GetMyLessonsResponse>
{
    public async Task<GetMyLessonsResponse> Handle(
        GetMyLessonsQuery request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new AppValidationException("UserId is required.");
        }

        var lessons = await lessonRepository.ListByUserIdAsync(
            request.UserId,
            request.Page,
            request.PageSize,
            request.ScriptStatus,
            request.OutputMode,
            request.Search);

        var count = await lessonRepository.CountByUserIdAsync(
            request.UserId,
            request.ScriptStatus,
            request.OutputMode,
            request.Search);

        var items = lessons
            .Select(LessonSummaryDto.FromEntity)
            .ToList();

        return new GetMyLessonsResponse(items, count);
    }
}
