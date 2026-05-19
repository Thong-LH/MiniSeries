using MiniSeries.Domain.Entities;

namespace MiniSeries.Application.Common.Interfaces;

public interface ILessonStore
{
    Task SaveAsync(Lesson lesson);
    Task<Lesson?> GetByIdAsync(Guid lessonId);
}
