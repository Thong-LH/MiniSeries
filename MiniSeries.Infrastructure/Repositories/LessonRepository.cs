using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
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

        foreach (var entry in dbContext.ChangeTracker.Entries<ChapterQuiz>()
                     .Where(x => x.State == EntityState.Modified))
        {
            var exists = await dbContext.ChapterQuizzes
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

    public async Task UpdateChapterMediaAsync(Guid chapterId, string? mangaUrl, string? videoUrl)
    {
        var chapter = await dbContext.Chapters.FindAsync(chapterId);
        if (chapter is null) return;

        if (mangaUrl is not null) chapter.MangaUrl = mangaUrl;
        if (videoUrl is not null) chapter.VideoUrl = videoUrl;
        chapter.Status = ChapterStatus.Generated;

        await dbContext.SaveChangesAsync();
    }

    public Task<Lesson?> GetByIdAsync(Guid lessonId)
    {
        return dbContext.Lessons
            .Include(x => x.Chapters.OrderBy(ch => ch.Order))
                .ThenInclude(x => x.Quiz)
            .Include(x => x.LlmJsons.OrderBy(json => json.CreatedAt))
            .Include(x => x.GenerationJobs.OrderBy(job => job.CreatedAt))
                .ThenInclude(x => x.Logs.OrderBy(log => log.CreatedAt))
            .FirstOrDefaultAsync(x => x.Id == lessonId);
    }

    public async Task<IReadOnlyList<Lesson>> ListByUserIdAsync(Guid userId)
    {
        return await dbContext.Lessons
            .AsNoTracking()
            .Include(x => x.Chapters)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }
}
