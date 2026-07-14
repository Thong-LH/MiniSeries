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
            .AsSplitQuery()
            .Include(x => x.Chapters.OrderBy(ch => ch.Order))
                .ThenInclude(x => x.Quiz)
            .Include(x => x.LlmJsons.OrderBy(json => json.CreatedAt))
            .Include(x => x.GenerationJobs.OrderBy(job => job.CreatedAt))
                .ThenInclude(x => x.Logs.OrderBy(log => log.CreatedAt))
            .FirstOrDefaultAsync(x => x.Id == lessonId);
    }

    public async Task<IReadOnlyList<Lesson>> ListByUserIdAsync(
        Guid userId,
        int? page = null,
        int? pageSize = null,
        ScriptStatus? scriptStatus = null,
        OutputMode? outputMode = null,
        string? search = null)
    {
        var query = dbContext.Lessons
            .AsNoTracking()
            .Where(x => x.UserId == userId);

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
            query = query.Where(x => x.Title.ToLower().Contains(search.ToLower()));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        if (page.HasValue && pageSize.HasValue)
        {
            query = query.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);
        }

        var data = await query
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
                ChapterCount = x.Chapters.Count,
                FirstMangaUrl = x.Chapters
                    .OrderBy(c => c.Order)
                    .Select(c => c.MangaUrl)
                    .FirstOrDefault(url => url != null && url != ""),
                FirstVideoUrl = x.Chapters
                    .OrderBy(c => c.Order)
                    .Select(c => c.VideoUrl)
                    .FirstOrDefault(url => url != null && url != ""),
                HasCompletedMediaJob = x.GenerationJobs.Any(j => j.Type == GenerationJobType.MediaGeneration && j.Status == GenerationJobStatus.Completed)
            })
            .ToListAsync();

        return data.Select(x => {
            var resolvedAnchor = !string.IsNullOrWhiteSpace(x.AnchorImageUrl)
                ? x.AnchorImageUrl
                : (!string.IsNullOrWhiteSpace(x.FirstMangaUrl) ? x.FirstMangaUrl : x.FirstVideoUrl);
 
            var mockChapters = new List<Chapter>();
            for (int i = 0; i < x.ChapterCount; i++)
            {
                mockChapters.Add(new Chapter 
                { 
                    Order = i + 1, 
                    MangaUrl = (i == 0 ? x.FirstMangaUrl : null),
                    VideoUrl = (i == 0 ? x.FirstVideoUrl : null)
                });
            }

            var mockJobs = new List<GenerationJob>();
            if (x.HasCompletedMediaJob)
            {
                mockJobs.Add(new GenerationJob
                {
                    Type = GenerationJobType.MediaGeneration,
                    Status = GenerationJobStatus.Completed
                });
            }
 
            return new Lesson
            {
                Id = x.Id,
                UserId = x.UserId,
                UserEmail = x.UserEmail,
                Title = x.Title,
                AnchorImageUrl = resolvedAnchor ?? string.Empty,
                OutputMode = x.OutputMode,
                ScriptStatus = x.ScriptStatus,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                ApprovedAt = x.ApprovedAt,
                Chapters = mockChapters,
                GenerationJobs = mockJobs
            };
        }).ToList();
    }

    public async Task<int> CountByUserIdAsync(
        Guid userId,
        ScriptStatus? scriptStatus = null,
        OutputMode? outputMode = null,
        string? search = null)
    {
        var query = dbContext.Lessons
            .AsNoTracking()
            .Where(x => x.UserId == userId);

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
            query = query.Where(x => x.Title.ToLower().Contains(search.ToLower()));
        }

        return await query.CountAsync();
    }
}
