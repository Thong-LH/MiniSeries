using MediatR;
using MiniSeries.Application.Common.Exceptions;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;

namespace MiniSeries.Application.Lessons.Commands.ReviewLessonScript;

public sealed class ReviewLessonScriptCommandHandler(
    ILLMService llmService,
    ILessonRepository lessonRepository)
    : IRequestHandler<ReviewLessonScriptCommand, LessonDto>
{
    public async Task<LessonDto> Handle(ReviewLessonScriptCommand request, CancellationToken cancellationToken)
    {
        Validate(request);

        var lesson = await lessonRepository.GetByIdAsync(request.LessonId)
                     ?? throw new NotFoundException("Lesson was not found.");

        if (lesson.ScriptStatus == ScriptStatus.Approved)
        {
            throw new BusinessRuleException("Approved lesson cannot be reviewed again.");
        }

        lesson.ScriptStatus = ScriptStatus.RevisionRequested;
        lesson.UpdatedAt = DateTime.UtcNow;

        var job = StartJob(lesson, GenerationJobType.ScriptRevision, "ReviseScriptDraft");
        try
        {
            AddLog(job, "ReviseScriptDraft", "Received feedback and started revising script.");
            var revised = await llmService.ReviseScriptDraftAsync(
                lesson.RawContent,
                lesson.OverallScript,
                request.Feedback,
                lesson.CreativeBrief);

            lesson.CharacterProfile = revised.CharacterProfile;
            lesson.OverallScript = revised.OverallScript;
            lesson.ScriptStatus = ScriptStatus.AwaitingReview;
            lesson.UpdatedAt = DateTime.UtcNow;
            lesson.LlmJsons.Add(new LlmJson
            {
                LessonId = lesson.Id,
                Purpose = LlmJsonPurpose.ScriptRevision,
                Provider = "Groq",
                Model = "llama-3.3-70b-versatile",
                RawJson = revised.RawJson,
                Feedback = request.Feedback
            });

            CompleteJob(job, "Script was revised and is ready for review again.");
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

    private static void Validate(ReviewLessonScriptCommand request)
    {
        var errors = new List<string>();

        if (request.LessonId == Guid.Empty)
        {
            errors.Add("LessonId is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Feedback))
        {
            errors.Add("Feedback is required.");
        }
        else if (request.Feedback.Length > 3000)
        {
            errors.Add("Feedback cannot exceed 3000 characters.");
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
