using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.CreateLessonDraft;

public sealed class CreateLessonDraftCommandHandler(
    ILLMService llmService,
    ILessonStore lessonStore)
    : IRequestHandler<CreateLessonDraftCommand, Lesson>
{
    public async Task<Lesson> Handle(CreateLessonDraftCommand request, CancellationToken cancellationToken)
    {
        var lesson = new Lesson
        {
            Title = request.Title,
            RawContent = request.RawContent,
            CreativeMode = request.CreativeMode,
            CreativeBrief = request.CreativeBrief,
            OutputMode = request.GenerateVideo ? OutputMode.Video : OutputMode.Manga,
            ScriptStatus = ScriptStatus.Draft
        };

        var job = StartJob(lesson, GenerationJobType.ScriptDraft, "CreateScriptDraft");
        try
        {
            AddLog(job, "CreateScriptDraft", "Bắt đầu tạo kịch bản tổng thể.");
            var draft = await llmService.CreateScriptDraftAsync(request.RawContent, request.CreativeBrief);

            lesson.CharacterProfile = draft.CharacterProfile;
            lesson.OverallScript = draft.OverallScript;
            lesson.ScriptStatus = ScriptStatus.AwaitingReview;
            lesson.UpdatedAt = DateTime.UtcNow;
            lesson.LlmJsons.Add(new LlmJson
            {
                LessonId = lesson.Id,
                Purpose = LlmJsonPurpose.ScriptDraft,
                Provider = "Groq",
                Model = "llama-3.3-70b-versatile",
                RawJson = draft.RawJson
            });

            CompleteJob(job, "Kịch bản tổng thể đã sẵn sàng để review.");
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
