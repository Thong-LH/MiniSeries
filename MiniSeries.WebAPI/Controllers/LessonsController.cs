using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Application.Lessons.Commands.ApproveLessonScript;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Application.Lessons.Commands.ReviewLessonScript;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Application.Lessons.Queries.GetLessonById;
using MiniSeries.Application.Lessons.Queries.GetMyLessons;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Authorize(Policy = "AuthenticatedUser")]
[Route("api/lessons")]
public sealed class LessonsController(
    IMediator mediator,
    UserPlanQuotaService quotaService) : ControllerBase
{
    [Authorize(Policy = "CustomerOnly")]
    [HttpPost("drafts")]
    public async Task<IActionResult> CreateDraft([FromBody] CreateLessonDraftCommand command)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await mediator.Send(command with
        {
            UserId = currentUserId.Value,
            UserEmail = AuthUser.GetCurrentUserEmail(User)
        });
        return Ok(result);
    }

    [Authorize(Policy = "CustomerOnly")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyLessons()
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await mediator.Send(new GetMyLessonsQuery(currentUserId.Value));
        return Ok(result);
    }

    [Authorize(Policy = "CustomerOnly")]
    [HttpPost("{lessonId:guid}/review")]
    public async Task<IActionResult> Review(Guid lessonId, [FromBody] ReviewLessonScriptRequest request)
    {
        var access = await GetAccessibleLessonAsync(lessonId);
        if (access.Result is not null)
        {
            return access.Result;
        }

        var result = await mediator.Send(new ReviewLessonScriptCommand(lessonId, request.Feedback));
        return Ok(result);
    }

    [Authorize(Policy = "CustomerOnly")]
    [HttpPost("{lessonId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid lessonId, [FromBody] ApproveLessonScriptRequest? request = null)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var access = await GetAccessibleLessonAsync(lessonId);
        if (access.Result is not null)
        {
            return access.Result;
        }

        var lesson = access.Lesson!;
        var reservation = await quotaService.TryReserveGenerationAsync(currentUserId.Value, lesson.OutputMode);
        if (!reservation.IsAllowed)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired, new
            {
                message = lesson.OutputMode == Domain.Enums.OutputMode.Video
                    ? "Ban da het luot generate video trong ky hien tai. Vui long nang cap goi hoac doi ky moi."
                    : "Ban da het luot generate manga trong ky hien tai. Vui long nang cap goi hoac doi ky moi.",
                quota = reservation.Quota
            });
        }

        try
        {
            var result = await mediator.Send(new ApproveLessonScriptCommand(lessonId, request?.OverallScript));
            var quota = await quotaService.GetSnapshotAsync(currentUserId.Value);
            return Ok(new
            {
                lesson = result,
                quota
            });
        }
        catch
        {
            await quotaService.RefundGenerationAsync(currentUserId.Value, lesson.OutputMode);
            throw;
        }
    }

    [HttpGet("{lessonId:guid}")]
    public async Task<IActionResult> GetById(Guid lessonId)
    {
        var result = await mediator.Send(new GetLessonByIdQuery(lessonId));
        if (result is null)
        {
            return NotFound();
        }

        if (!CanAccessLesson(result))
        {
            return Forbid();
        }

        return Ok(result);
    }

    private async Task<(IActionResult? Result, LessonDto? Lesson)> GetAccessibleLessonAsync(Guid lessonId)
    {
        var lesson = await mediator.Send(new GetLessonByIdQuery(lessonId));
        if (lesson is null)
        {
            return (NotFound(), null);
        }

        return CanAccessLesson(lesson) ? (null, lesson) : (Forbid(), null);
    }

    private bool CanAccessLesson(LessonDto lesson)
    {
        if (User.IsInRole("Staff") || User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = AuthUser.GetCurrentUserId(User);
        return currentUserId is not null && lesson.UserId == currentUserId.Value;
    }
}
