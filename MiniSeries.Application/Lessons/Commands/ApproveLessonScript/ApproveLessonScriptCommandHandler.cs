using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.ApproveLessonScript;

public sealed class ApproveLessonScriptCommandHandler(
    ILLMService llmService,
    IImageGenerationService imageGenerationService,
    IMangaService mangaService,
    IVideoService videoService,
    IStorageService storageService,
    ILessonStore lessonStore)
    : IRequestHandler<ApproveLessonScriptCommand, Lesson>
{
    public async Task<Lesson> Handle(ApproveLessonScriptCommand request, CancellationToken cancellationToken)
    {
        var lesson = await lessonStore.GetByIdAsync(request.LessonId)
                     ?? throw new InvalidOperationException("Không tìm thấy lesson cần duyệt.");

        if (lesson.ScriptStatus != ScriptStatus.AwaitingReview)
        {
            throw new InvalidOperationException("Lesson chỉ có thể được duyệt khi đang chờ review.");
        }

        lesson.ScriptStatus = ScriptStatus.Approved;
        lesson.ApprovedAt = DateTime.UtcNow;
        lesson.UpdatedAt = DateTime.UtcNow;

        var job = StartJob(lesson, GenerationJobType.MediaGeneration, "CreateChapters");
        try
        {
            AddLog(job, "CreateChapters", "Bắt đầu tạo chapter chi tiết từ kịch bản đã duyệt.");
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
                Status = ChapterStatus.ReadyForGeneration
            }).ToList();

            job.CurrentStep = "GenerateAnchorImage";
            AddLog(job, "GenerateAnchorImage", "Bắt đầu tạo anchor image.");
            var anchorLocalUrl = await imageGenerationService.GenerateAnchorImageAsync(lesson.CharacterProfile);
            lesson.AnchorImageUrl = await storageService.UploadAsync(anchorLocalUrl, $"anchor_{lesson.Id}");

            foreach (var chapter in lesson.Chapters)
            {
                job.CurrentStep = lesson.OutputMode == OutputMode.Video
                    ? $"GenerateVideoChapter_{chapter.Order}"
                    : $"GenerateMangaChapter_{chapter.Order}";

                if (lesson.OutputMode == OutputMode.Video)
                {
                    var videoUrl = await videoService.GenerateVideoClipAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                    chapter.VideoUrl = await storageService.UploadAsync(videoUrl, $"chapter_vid_{chapter.Id}");
                }
                else
                {
                    var mangaPageUrl = await mangaService.GenerateMangaPageAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                    chapter.MangaUrl = await storageService.UploadAsync(mangaPageUrl, $"chapter_{chapter.Order}_{lesson.Id}");
                }

                chapter.Status = ChapterStatus.Generated;
                AddLog(job, job.CurrentStep, $"Đã sinh xong chapter {chapter.Order}.");
            }

            CompleteJob(job, "Đã sinh xong toàn bộ media cho lesson.");
            await lessonStore.SaveAsync(lesson);
            return lesson;
        }
        catch (Exception ex)
        {
            FailJob(job, ex);
            await lessonStore.SaveAsync(lesson);
            throw;
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
