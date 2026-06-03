using MediatR;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;

namespace MiniSeries.Application.Lessons.Queries.GetMyLessons;

public sealed class GetMyLessonsQueryHandler(ILessonRepository lessonRepository)
    : IRequestHandler<GetMyLessonsQuery, IReadOnlyList<LessonSummaryDto>>
{
    public async Task<IReadOnlyList<LessonSummaryDto>> Handle(
        GetMyLessonsQuery request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new AppValidationException("UserId is required.");
        }

        var lessons = await lessonRepository.ListByUserIdAsync(request.UserId);
        return lessons
            .Select(LessonSummaryDto.FromEntity)
            .ToList();
    }
}
