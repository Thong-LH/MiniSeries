using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MiniSeries.Infrastructure.Repositories;

public sealed class LessonRepository(MiniSeriesDbContext dbContext) : ILessonRepository
{
    public async Task SaveAsync(Lesson lesson)
    {
        if (dbContext.Entry(lesson).State != EntityState.Detached)
        {
            await MarkMissingChildrenAsAddedAsync();
            await dbContext.SaveChangesAsync();
            return;
        }

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

    private async Task MarkMissingChildrenAsAddedAsync()
    {
        foreach (var entry in dbContext.ChangeTracker.Entries<Chapter>()
                     .Where(x => x.State == EntityState.Modified))
        {
            var exists = await dbContext.Chapters
                .AsNoTracking()
                .AnyAsync(x => x.Id == entry.Entity.Id);

            if (!exists)
            {
                entry.State = EntityState.Added;
            }
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<GenerationJob>()
                     .Where(x => x.State == EntityState.Modified))
        {
            var exists = await dbContext.GenerationJobs
                .AsNoTracking()
                .AnyAsync(x => x.Id == entry.Entity.Id);

            if (!exists)
            {
                entry.State = EntityState.Added;
            }
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<GenerationLog>()
                     .Where(x => x.State == EntityState.Modified))
        {
            var exists = await dbContext.GenerationLogs
                .AsNoTracking()
                .AnyAsync(x => x.Id == entry.Entity.Id);

            if (!exists)
            {
                entry.State = EntityState.Added;
            }
        }

        foreach (var entry in dbContext.ChangeTracker.Entries<LlmJson>()
                     .Where(x => x.State == EntityState.Modified))
        {
            var exists = await dbContext.LlmJsons
                .AsNoTracking()
                .AnyAsync(x => x.Id == entry.Entity.Id);

            if (!exists)
            {
                entry.State = EntityState.Added;
            }
        }
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
