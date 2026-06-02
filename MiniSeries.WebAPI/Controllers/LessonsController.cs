using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Application.Lessons.Commands.ApproveLessonScript;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Application.Lessons.Commands.ReviewLessonScript;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Application.Lessons.Queries.GetLessonById;
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
        var result = await mediator.Send(command);
        return Ok(result);
    }

    [Authorize(Policy = "CustomerOnly")]
    [HttpPost("{lessonId:guid}/review")]
    public async Task<IActionResult> Review(Guid lessonId, [FromBody] ReviewLessonScriptRequest request)
    {
        var result = await mediator.Send(new ReviewLessonScriptCommand(lessonId, request.Feedback));
        return Ok(result);
    }

    [Authorize(Policy = "CustomerOnly")]
    [HttpPost("{lessonId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid lessonId)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var reservation = await quotaService.TryReserveGenerationAsync(currentUserId.Value);
        if (!reservation.IsAllowed)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired, new
            {
                message = "Ban da het luot generate trong ky hien tai. Vui long nang cap goi hoac doi ky moi.",
                quota = reservation.Quota
            });
        }

        try
        {
            var result = await mediator.Send(new ApproveLessonScriptCommand(lessonId));
            var quota = await quotaService.GetSnapshotAsync(currentUserId.Value);
            return Ok(new
            {
                lesson = result,
                quota
            });
        }
        catch
        {
            await quotaService.RefundGenerationAsync(currentUserId.Value);
            throw;
        }
    }

    [HttpGet("{lessonId:guid}")]
    public async Task<IActionResult> GetById(Guid lessonId)
    {
        var result = await mediator.Send(new GetLessonByIdQuery(lessonId));
        return result is null ? NotFound() : Ok(result);
    }
}
