using System.Collections.Concurrent;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Infrastructure.Repositories;

public sealed class InMemoryLessonRepository : ILessonRepository
{
    private readonly ConcurrentDictionary<Guid, Lesson> _lessons = new();

    public Task SaveAsync(Lesson lesson)
    {
        _lessons[lesson.Id] = lesson;
        return Task.CompletedTask;
    }

    public Task<Lesson?> GetByIdAsync(Guid lessonId)
    {
        _lessons.TryGetValue(lessonId, out var lesson);
        return Task.FromResult(lesson);
    }

    public Task UpdateChapterMediaAsync(Guid chapterId, string? mangaUrl, string? videoUrl)
    {
        foreach (var lesson in _lessons.Values)
        {
            var chapter = lesson.Chapters.FirstOrDefault(c => c.Id == chapterId);
            if (chapter is null) continue;

            if (mangaUrl is not null) chapter.MangaUrl = mangaUrl;
            if (videoUrl is not null) chapter.VideoUrl = videoUrl;
            chapter.Status = ChapterStatus.Generated;
            break;
        }
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<Lesson>> ListByUserIdAsync(Guid userId)
    {
        IReadOnlyList<Lesson> lessons = _lessons.Values
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToList();
        return Task.FromResult(lessons);
    }
}
