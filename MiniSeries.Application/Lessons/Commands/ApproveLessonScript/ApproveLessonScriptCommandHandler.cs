using MediatR;
using Microsoft.Extensions.DependencyInjection;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Commands.ApproveLessonScript;

public sealed class ApproveLessonScriptCommandHandler(
    IServiceScopeFactory scopeFactory,
    ILessonRepository lessonRepository)
    : IRequestHandler<ApproveLessonScriptCommand, LessonDto>
{
    public async Task<LessonDto> Handle(ApproveLessonScriptCommand request, CancellationToken cancellationToken)
    {
        if (request.LessonId == Guid.Empty)
        {
            throw new AppValidationException("LessonId is required.");
        }

        var lesson = await lessonRepository.GetByIdAsync(request.LessonId)
                     ?? throw new NotFoundException("Lesson was not found.");

        if (lesson.ScriptStatus != ScriptStatus.AwaitingReview && lesson.ScriptStatus != ScriptStatus.Approved)
        {
            throw new BusinessRuleException("Lesson can only be approved when it is awaiting review or approved.");
        }

        if (!string.IsNullOrWhiteSpace(request.OverallScript))
        {
            lesson.OverallScript = request.OverallScript;
        }

        // Idempotency guard: skip if a media job is already Running or Completed
        var existingMediaJob = lesson.GenerationJobs
            .Where(j => j.Type == GenerationJobType.MediaGeneration)
            .OrderByDescending(j => j.CreatedAt)
            .FirstOrDefault();

        if (existingMediaJob is not null &&
            (existingMediaJob.Status == GenerationJobStatus.Running ||
             existingMediaJob.Status == GenerationJobStatus.Completed))
        {
            return LessonDto.FromEntity(lesson);
        }

        // Idempotency guard: skip if chapters already have generated media
        if (lesson.Chapters.Any(c =>
            !string.IsNullOrWhiteSpace(c.MangaUrl) ||
            !string.IsNullOrWhiteSpace(c.VideoUrl)))
        {
            return LessonDto.FromEntity(lesson);
        }

        lesson.ScriptStatus = ScriptStatus.Approved;
        lesson.ApprovedAt = DateTime.UtcNow;
        lesson.UpdatedAt = DateTime.UtcNow;

        var job = StartJob(lesson, GenerationJobType.MediaGeneration, "CreateChapters");
        AddLog(job, "CreateChapters", "Started creating chapters from approved script.");
        
        await lessonRepository.SaveAsync(lesson);

        // Fire and forget the background media generation process
        _ = Task.Run(async () =>
        {
            await GenerateMediaInBackgroundAsync(lesson.Id, job.Id);
        });

        return LessonDto.FromEntity(lesson);
    }

    private async Task GenerateMediaInBackgroundAsync(Guid lessonId, Guid jobId)
    {
        using var scope = scopeFactory.CreateScope();
        var sp = scope.ServiceProvider;

        var backgroundLessonRepository = sp.GetRequiredService<ILessonRepository>();
        var llmService = sp.GetRequiredService<ILLMService>();
        var imageGenerationService = sp.GetRequiredService<IImageGenerationService>();
        var storageService = sp.GetRequiredService<IStorageService>();

        var lesson = await backgroundLessonRepository.GetByIdAsync(lessonId);
        if (lesson is null) return;

        var job = lesson.GenerationJobs.FirstOrDefault(j => j.Id == jobId);
        if (job is null) return;

        try
        {
            // Step 1: Create chapters via LLM
            var chapterDraft = await llmService.CreateChaptersAsync(
                lesson.RawContent,
                lesson.OverallScript,
                lesson.CharacterProfile);

            lesson.LlmJsons.Add(new LlmJson
            {
                LessonId = lesson.Id,
                Purpose = LlmJsonPurpose.ChapterGeneration,
                Provider = "Groq",
                Model = "llama-3.3-70b-versatile",
                RawJson = chapterDraft.RawJson
            });

            // Guard: only create chapters if none exist yet (prevent overwrite on retry)
            if (!lesson.Chapters.Any())
            {
                lesson.Chapters = chapterDraft.Chapters.Select(ch => new Chapter
                {
                    LessonId = lesson.Id,
                    Order = ch.Order,
                    Summary = ch.Summary,
                    FullPrompt = ch.FullPrompt,
                    Status = ChapterStatus.ReadyForGeneration,
                    Quiz = new ChapterQuiz
                    {
                        Question = ch.Quiz.Question,
                        OptionA = ch.Quiz.OptionA,
                        OptionB = ch.Quiz.OptionB,
                        OptionC = ch.Quiz.OptionC,
                        OptionD = ch.Quiz.OptionD,
                        CorrectOption = ch.Quiz.CorrectOption,
                        Explanation = ch.Quiz.Explanation
                    }
                }).ToList();

                await backgroundLessonRepository.SaveAsync(lesson);
            }

            // Step 2: Generate anchor image
            job.CurrentStep = "GenerateAnchorImage";
            AddLog(job, "GenerateAnchorImage", "Started generating anchor image.");
            await backgroundLessonRepository.SaveAsync(lesson);

            var anchorLocalUrl = await imageGenerationService.GenerateAnchorImageAsync(lesson.CharacterProfile);
            lesson.AnchorImageUrl = await storageService.UploadAsync(anchorLocalUrl, $"anchor_{lesson.Id}");
            await backgroundLessonRepository.SaveAsync(lesson);

            // Step 3 & 4: Generate + upload all chapters in parallel (max 3 at a time)
            job.CurrentStep = "GenerateChapters";
            AddLog(job, "GenerateChapters", $"Starting parallel generation for {lesson.Chapters.Count} chapters.");
            await backgroundLessonRepository.SaveAsync(lesson);

            using var semaphore = new SemaphoreSlim(3);

            // Snapshot chapter data before parallel execution (avoid sharing mutable entity objects)
            var chapterSnapshots = lesson.Chapters
                .Select(c => (c.Id, c.Order, c.FullPrompt))
                .ToList();

            var chapterTasks = chapterSnapshots.Select(ch =>
                ProcessChapterAsync(
                    lesson.Id,
                    ch.Id,
                    ch.Order,
                    ch.FullPrompt,
                    lesson.AnchorImageUrl!,
                    lesson.OutputMode,
                    semaphore));

            await Task.WhenAll(chapterTasks);

            CompleteJob(job, "Generated all media for lesson.");
            await backgroundLessonRepository.SaveAsync(lesson);
        }
        catch (Exception ex)
        {
            FailJob(job, ex);
            await backgroundLessonRepository.SaveAsync(lesson);
        }
    }

    private async Task ProcessChapterAsync(
        Guid lessonId,
        Guid chapterId,
        int chapterOrder,
        string fullPrompt,
        string anchorImageUrl,
        OutputMode outputMode,
        SemaphoreSlim semaphore)
    {
        await semaphore.WaitAsync();
        try
        {
            using var chapterScope = scopeFactory.CreateScope();
            var sp = chapterScope.ServiceProvider;
            var chapterRepo = sp.GetRequiredService<ILessonRepository>();
            var mangaService = sp.GetRequiredService<IMangaService>();
            var storageService = sp.GetRequiredService<IStorageService>();
            var videoService = sp.GetRequiredService<IVideoService>();

            if (outputMode == OutputMode.Video)
            {
                var videoUrl = await videoService.GenerateVideoClipAsync(anchorImageUrl, fullPrompt);
                var uploadedUrl = await storageService.UploadAsync(videoUrl, $"chapter_vid_{chapterId}");
                await chapterRepo.UpdateChapterMediaAsync(chapterId, null, uploadedUrl);
            }
            else
            {
                var mangaPageUrl = await mangaService.GenerateMangaPageAsync(anchorImageUrl, fullPrompt);
                var uploadedUrl = await storageService.UploadAsync(mangaPageUrl, $"chapter_{chapterOrder}_{lessonId}");
                await chapterRepo.UpdateChapterMediaAsync(chapterId, uploadedUrl, null);
            }
        }
        finally
        {
            semaphore.Release();
        }
    }

    private static GenerationJob StartJob(Lesson lesson, GenerationJobType type, string step)
    {
        var job = new GenerationJob
        {
            LessonId = lesson.Id,
            Type = type,
            Status = GenerationJobStatus.Running,
            CurrentStep = step,
            StartedAt = DateTime.UtcNow
        };
        lesson.GenerationJobs.Add(job);
        return job;
    }

    private static void AddLog(GenerationJob job, string step, string message)
    {
        job.Logs.Add(new GenerationLog
        {
            GenerationJobId = job.Id,
            Step = step,
            Message = message
        });
    }

    private static void CompleteJob(GenerationJob job, string message)
    {
        job.Status = GenerationJobStatus.Completed;
        job.CompletedAt = DateTime.UtcNow;
        AddLog(job, job.CurrentStep, message);
    }

    private static void FailJob(GenerationJob job, Exception ex)
    {
        job.Status = GenerationJobStatus.Failed;
        job.ErrorMessage = ex.Message;
        job.CompletedAt = DateTime.UtcNow;
        job.Logs.Add(new GenerationLog
        {
            GenerationJobId = job.Id,
            Level = GenerationLogLevel.Error,
            Step = job.CurrentStep,
            Message = ex.Message
        });
    }
}
