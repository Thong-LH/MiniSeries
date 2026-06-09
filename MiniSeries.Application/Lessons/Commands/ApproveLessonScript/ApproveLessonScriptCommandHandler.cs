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

        if (lesson.ScriptStatus != ScriptStatus.AwaitingReview)
        {
            throw new BusinessRuleException("Lesson can only be approved when it is awaiting review.");
        }

        if (!string.IsNullOrWhiteSpace(request.OverallScript))
        {
            lesson.OverallScript = request.OverallScript;
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
        var mangaService = sp.GetRequiredService<IMangaService>();
        var videoService = sp.GetRequiredService<IVideoService>();
        var storageService = sp.GetRequiredService<IStorageService>();

        var lesson = await backgroundLessonRepository.GetByIdAsync(lessonId);
        if (lesson is null) return;

        var job = lesson.GenerationJobs.FirstOrDefault(j => j.Id == jobId);
        if (job is null) return;

        try
        {
            // Step 1: Create chapters
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

            // Save chapters to DB
            await backgroundLessonRepository.SaveAsync(lesson);

            // Step 2: Generate anchor image
            job.CurrentStep = "GenerateAnchorImage";
            AddLog(job, "GenerateAnchorImage", "Started generating anchor image.");
            await backgroundLessonRepository.SaveAsync(lesson);

            var anchorLocalUrl = await imageGenerationService.GenerateAnchorImageAsync(lesson.CharacterProfile);
            lesson.AnchorImageUrl = await storageService.UploadAsync(anchorLocalUrl, $"anchor_{lesson.Id}");
            await backgroundLessonRepository.SaveAsync(lesson);

            // Step 3 & 4: Generate media for chapters and upload to Cloudinary
            foreach (var chapter in lesson.Chapters)
            {
                if (lesson.OutputMode == OutputMode.Video)
                {
                    job.CurrentStep = $"GenerateVideoChapter_{chapter.Order}";
                    AddLog(job, job.CurrentStep, $"Started generating video for chapter {chapter.Order}.");
                    await backgroundLessonRepository.SaveAsync(lesson);

                    var videoUrl = await videoService.GenerateVideoClipAsync(lesson.AnchorImageUrl, chapter.FullPrompt);

                    job.CurrentStep = $"UploadVideoChapter_{chapter.Order}";
                    AddLog(job, job.CurrentStep, $"Started uploading video for chapter {chapter.Order} to Cloudinary.");
                    await backgroundLessonRepository.SaveAsync(lesson);

                    chapter.VideoUrl = await storageService.UploadAsync(videoUrl, $"chapter_vid_{chapter.Id}");
                    AddLog(job, job.CurrentStep, $"Uploaded video for chapter {chapter.Order}.");
                }
                else
                {
                    job.CurrentStep = $"GenerateMangaChapter_{chapter.Order}";
                    AddLog(job, job.CurrentStep, $"Started generating manga page for chapter {chapter.Order}.");
                    await backgroundLessonRepository.SaveAsync(lesson);

                    var mangaPageUrl = await mangaService.GenerateMangaPageAsync(lesson.AnchorImageUrl, chapter.FullPrompt);

                    job.CurrentStep = $"UploadMangaChapter_{chapter.Order}";
                    AddLog(job, job.CurrentStep, $"Started uploading manga page for chapter {chapter.Order} to Cloudinary.");
                    await backgroundLessonRepository.SaveAsync(lesson);

                    chapter.MangaUrl = await storageService.UploadAsync(mangaPageUrl, $"chapter_{chapter.Order}_{lesson.Id}");
                    AddLog(job, job.CurrentStep, $"Uploaded manga page for chapter {chapter.Order}.");
                }

                chapter.Status = ChapterStatus.Generated;
                AddLog(job, job.CurrentStep, $"Generated chapter {chapter.Order}.");
                await backgroundLessonRepository.SaveAsync(lesson);
            }

            CompleteJob(job, "Generated all media for lesson.");
            await backgroundLessonRepository.SaveAsync(lesson);
        }
        catch (Exception ex)
        {
            FailJob(job, ex);
            await backgroundLessonRepository.SaveAsync(lesson);
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
