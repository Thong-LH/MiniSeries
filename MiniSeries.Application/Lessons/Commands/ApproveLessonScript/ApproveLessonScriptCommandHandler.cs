using MediatR;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Commands.ApproveLessonScript;

public sealed class ApproveLessonScriptCommandHandler(
    ILLMService llmService,
    IImageGenerationService imageGenerationService,
    IMangaService mangaService,
    IVideoService videoService,
    IStorageService storageService,
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

        lesson.ScriptStatus = ScriptStatus.Approved;
        lesson.ApprovedAt = DateTime.UtcNow;
        lesson.UpdatedAt = DateTime.UtcNow;

        var job = StartJob(lesson, GenerationJobType.MediaGeneration, "CreateChapters");
        try
        {
            AddLog(job, "CreateChapters", "Started creating chapters from approved script.");
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

            job.CurrentStep = "GenerateAnchorImage";
            AddLog(job, "GenerateAnchorImage", "Started generating anchor image.");
            var anchorLocalUrl = await imageGenerationService.GenerateAnchorImageAsync(lesson.CharacterProfile);
            lesson.AnchorImageUrl = await storageService.UploadAsync(anchorLocalUrl, $"anchor_{lesson.Id}");

            foreach (var chapter in lesson.Chapters)
            {
                job.CurrentStep = lesson.OutputMode == OutputMode.Video
                    ? $"GenerateVideoChapter_{chapter.Order}"
                    : $"GenerateMangaChapter_{chapter.Order}";

                if (lesson.OutputMode == OutputMode.Video)
                {
                    AddLog(job, job.CurrentStep, $"Started generating video for chapter {chapter.Order}.");
                    var videoUrl = await videoService.GenerateVideoClipAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                    chapter.VideoUrl = await storageService.UploadAsync(videoUrl, $"chapter_vid_{chapter.Id}");
                    AddLog(job, job.CurrentStep, $"Uploaded video for chapter {chapter.Order}.");
                }
                else
                {
                    AddLog(job, job.CurrentStep, $"Started generating manga page for chapter {chapter.Order}.");
                    var mangaPageUrl = await mangaService.GenerateMangaPageAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                    chapter.MangaUrl = await storageService.UploadAsync(mangaPageUrl, $"chapter_{chapter.Order}_{lesson.Id}");
                    AddLog(job, job.CurrentStep, $"Uploaded manga page for chapter {chapter.Order}.");
                }

                chapter.Status = ChapterStatus.Generated;
                AddLog(job, job.CurrentStep, $"Generated chapter {chapter.Order}.");
            }

            CompleteJob(job, "Generated all media for lesson.");
            await lessonRepository.SaveAsync(lesson);
            return LessonDto.FromEntity(lesson);
        }
        catch (Exception ex)
        {
            FailJob(job, ex);
            await lessonRepository.SaveAsync(lesson);
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
