using System.Collections.Concurrent;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;

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

    public Task<IReadOnlyList<Lesson>> ListByUserIdAsync(Guid userId)
    {
        IReadOnlyList<Lesson> lessons = _lessons.Values
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToList();
        return Task.FromResult(lessons);
    }
}
