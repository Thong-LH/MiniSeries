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

    public Task<IReadOnlyList<Lesson>> ListByUserIdAsync(
        Guid userId,
        int? page = null,
        int? pageSize = null,
        ScriptStatus? scriptStatus = null,
        OutputMode? outputMode = null,
        string? search = null)
    {
        var query = _lessons.Values.Where(x => x.UserId == userId);

        if (scriptStatus.HasValue)
        {
            query = query.Where(x => x.ScriptStatus == scriptStatus.Value);
        }

        if (outputMode.HasValue)
        {
            query = query.Where(x => x.OutputMode == outputMode.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Title.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        if (page.HasValue && pageSize.HasValue)
        {
            query = query.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);
        }

        IReadOnlyList<Lesson> lessons = query.ToList();
        return Task.FromResult(lessons);
    }
}
