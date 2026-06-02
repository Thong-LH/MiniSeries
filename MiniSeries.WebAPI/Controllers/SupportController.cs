using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/support")]
public sealed class SupportController(SupabaseRestService supabase) : ControllerBase
{
    [Authorize(Policy = "AuthenticatedUser")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] SupportCreateRequest req)
    {
        var customerEmail = AuthUser.GetCurrentUserEmail(User);
        if (string.IsNullOrWhiteSpace(customerEmail) || string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Thieu email hoac noi dung yeu cau." });
        }

        try
        {
            var item = await supabase.CreateSupportAsync(customerEmail.Trim(), req.Content.Trim());
            return item is null ? StatusCode(500) : Ok(item);
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
            var list = await supabase.ListSupportAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpPost("reply")]
    public async Task<IActionResult> Reply([FromBody] SupportReplyRequest req)
    {
        var supportId = req.ResolveId();
        var replyText = req.ResolveReply();
        if (supportId is null)
        {
            return BadRequest(new { message = "ID yeu cau tu van khong hop le hoac bi thieu." });
        }
        if (string.IsNullOrWhiteSpace(replyText))
        {
            return BadRequest(new { message = "Thieu noi dung phan hoi." });
        }

        try
        {
            var item = await supabase.ReplySupportAsync(supportId.Value, replyText.Trim());
            return item is null
                ? NotFound(new { message = "Khong tim thay yeu cau tu van." })
                : Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
