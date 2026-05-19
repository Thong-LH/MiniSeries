using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class EfLessonStore(MiniSeriesDbContext dbContext) : ILessonStore
{
    public async Task SaveAsync(Lesson lesson)
    {
        var exists = await dbContext.Lessons.AnyAsync(x => x.Id == lesson.Id);

        if (exists)
        {
            dbContext.Lessons.Update(lesson);
        }
        else
        {
            await dbContext.Lessons.AddAsync(lesson);
        }

        await dbContext.SaveChangesAsync();
    }

    public Task<Lesson?> GetByIdAsync(Guid lessonId)
    {
        return dbContext.Lessons
            .Include(x => x.Chapters.OrderBy(ch => ch.Order))
            .Include(x => x.LlmJsons.OrderBy(json => json.CreatedAt))
            .Include(x => x.GenerationJobs.OrderBy(job => job.CreatedAt))
                .ThenInclude(x => x.Logs.OrderBy(log => log.CreatedAt))
            .FirstOrDefaultAsync(x => x.Id == lessonId);
    }
}
