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
        var data = await dbContext.Lessons
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.UserId,
                x.UserEmail,
                x.Title,
                x.AnchorImageUrl,
                x.OutputMode,
                x.ScriptStatus,
                x.CreatedAt,
                x.UpdatedAt,
                x.ApprovedAt,
                Chapters = x.Chapters.Select(c => new { c.Order, c.MangaUrl }).ToList()
            })
            .ToListAsync();

        return data.Select(x => new Lesson
        {
            Id = x.Id,
            UserId = x.UserId,
            UserEmail = x.UserEmail,
            Title = x.Title,
            AnchorImageUrl = x.AnchorImageUrl,
            OutputMode = x.OutputMode,
            ScriptStatus = x.ScriptStatus,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
            ApprovedAt = x.ApprovedAt,
            Chapters = x.Chapters.Select(c => new Chapter
            {
                Order = c.Order,
                MangaUrl = c.MangaUrl
            }).ToList()
        }).ToList();
    }
}
