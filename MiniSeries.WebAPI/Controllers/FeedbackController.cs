using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/feedback")]
public sealed class FeedbackController(SupabaseRestService supabase) : ControllerBase
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
            var item = await supabase.CreateFeedbackAsync(email, req.Rating, req.Comment.Trim());
            return item is null ? StatusCode(500) : Ok(item);
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
            var list = await supabase.ListFeedbacksAsync();
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
            var list = await supabase.ListFeedbacksAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
