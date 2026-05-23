using MediatR;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Application.Lessons.Commands.ApproveLessonScript;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Application.Lessons.Commands.ReviewLessonScript;
using MiniSeries.Application.Lessons.Dtos;
using MiniSeries.Application.Lessons.Queries.GetLessonById;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/lessons")]
public sealed class LessonsController(IMediator mediator) : ControllerBase
{
    [HttpPost("drafts")]
    public async Task<IActionResult> CreateDraft([FromBody] CreateLessonDraftCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(result);
    }

    [HttpPost("{lessonId:guid}/review")]
    public async Task<IActionResult> Review(Guid lessonId, [FromBody] ReviewLessonScriptRequest request)
    {
        var result = await mediator.Send(new ReviewLessonScriptCommand(lessonId, request.Feedback));
        return Ok(result);
    }

    [HttpPost("{lessonId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid lessonId)
    {
        var result = await mediator.Send(new ApproveLessonScriptCommand(lessonId));
        return Ok(result);
    }

    [HttpGet("{lessonId:guid}")]
    public async Task<IActionResult> GetById(Guid lessonId)
    {
        var result = await mediator.Send(new GetLessonByIdQuery(lessonId));
        return result is null ? NotFound() : Ok(result);
    }
}
