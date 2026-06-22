using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/feedback")]
public sealed class FeedbackController(MiniSeriesDbContext dbContext) : ControllerBase
{
    [Authorize(Policy = "AuthenticatedUser")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] FeedbackCreateRequest req)
    {
        if (req.Rating is < 1 or > 5 || string.IsNullOrWhiteSpace(req.Comment))
        {
            return BadRequest(new { message = "Danh gia khong hop le." });
        }

        var email = AuthUser.GetCurrentUserEmail(User);
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Khong tim thay email cua tai khoan dang dang nhap." });
        }

        try
        {
            var item = new Feedback
            {
                Id = Guid.NewGuid(),
                Email = email,
                Rating = req.Rating,
                Comment = req.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Feedbacks.Add(item);
            await dbContext.SaveChangesAsync();

            return Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("public-list")]
    public async Task<IActionResult> PublicList()
    {
        try
        {
            var list = await dbContext.Feedbacks
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("list")]
    public async Task<IActionResult> List()
    {
        try
        {
            var list = await dbContext.Feedbacks
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
