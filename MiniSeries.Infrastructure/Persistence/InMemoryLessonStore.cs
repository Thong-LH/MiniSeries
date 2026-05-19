using System.Collections.Concurrent;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class InMemoryLessonStore : ILessonStore
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
}
