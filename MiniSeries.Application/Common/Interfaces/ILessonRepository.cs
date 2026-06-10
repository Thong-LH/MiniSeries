using MiniSeries.Domain.Entities;

namespace MiniSeries.Application.Common.Interfaces;

public interface ILessonRepository
{
    Task SaveAsync(Lesson lesson);
    Task<Lesson?> GetByIdAsync(Guid lessonId);
    Task<IReadOnlyList<Lesson>> ListByUserIdAsync(Guid userId);
    Task UpdateChapterMediaAsync(Guid chapterId, string? mangaUrl, string? videoUrl);
}
