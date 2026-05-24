using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.CreateLessonDraft;

public sealed class CreateLessonDraftCommandHandler(
    ILLMService llmService,
    ILessonRepository lessonRepository)
    : IRequestHandler<CreateLessonDraftCommand, LessonDto>
{
    public async Task<LessonDto> Handle(CreateLessonDraftCommand request, CancellationToken cancellationToken)
    {
        Validate(request);

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

    private static void Validate(CreateLessonDraftCommand request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            errors.Add("Title is required.");
        }
        else if (request.Title.Length > 200)
        {
            errors.Add("Title cannot exceed 200 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.RawContent))
        {
            errors.Add("RawContent is required.");
        }
        else if (request.RawContent.Length > 20000)
        {
            errors.Add("RawContent cannot exceed 20000 characters.");
        }

        if (request.CreativeBrief?.Length > 2000)
        {
            errors.Add("CreativeBrief cannot exceed 2000 characters.");
        }

        if (request.CreativeMode == CreativeMode.Guided && string.IsNullOrWhiteSpace(request.CreativeBrief))
        {
            errors.Add("CreativeBrief is required when CreativeMode is Guided.");
        }

        if (errors.Count > 0)
        {
            throw new AppValidationException(errors.ToArray());
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
