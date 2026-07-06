using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Common.Interfaces;

public interface ILessonRepository
{
    Task SaveAsync(Lesson lesson);
    Task<Lesson?> GetByIdAsync(Guid lessonId);
    Task<IReadOnlyList<Lesson>> ListByUserIdAsync(
        Guid userId,
        int? page = null,
        int? pageSize = null,
        ScriptStatus? scriptStatus = null,
        OutputMode? outputMode = null,
        string? search = null);
    Task UpdateChapterMediaAsync(Guid chapterId, string? mangaUrl, string? videoUrl);
}
