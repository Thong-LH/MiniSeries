using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.ReviewLessonScript;

public sealed class ReviewLessonScriptCommandHandler(
    ILLMService llmService,
    ILessonRepository lessonRepository)
    : IRequestHandler<ReviewLessonScriptCommand, LessonDto>
{
    public async Task<LessonDto> Handle(ReviewLessonScriptCommand request, CancellationToken cancellationToken)
    {
        var lesson = await lessonRepository.GetByIdAsync(request.LessonId)
                     ?? throw new InvalidOperationException("Không tìm thấy lesson cần review.");

        if (lesson.ScriptStatus == ScriptStatus.Approved)
        {
            throw new InvalidOperationException("Lesson đã được duyệt, không thể revise script nữa.");
        }

        lesson.ScriptStatus = ScriptStatus.RevisionRequested;
        lesson.UpdatedAt = DateTime.UtcNow;

        var job = StartJob(lesson, GenerationJobType.ScriptRevision, "ReviseScriptDraft");
        try
        {
            AddLog(job, "ReviseScriptDraft", "Nhận feedback và bắt đầu revise kịch bản.");
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

            CompleteJob(job, "Kịch bản đã được revise và chờ review lại.");
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
