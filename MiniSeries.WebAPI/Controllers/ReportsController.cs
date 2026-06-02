using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/report")]
public sealed class ReportsController(SupabaseRestService supabase) : ControllerBase
{
    [Authorize(Policy = "StaffOnly")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] ReportCreateRequest req)
    {
        var staffName = AuthUser.GetCurrentUserName(User) ?? AuthUser.GetCurrentUserEmail(User);
        if (string.IsNullOrWhiteSpace(staffName) || string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Thieu ten Staff hoac noi dung bao cao." });
        }

        try
        {
            var item = await supabase.CreateReportAsync(staffName.Trim(), req.Content.Trim());
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
            var list = await supabase.ListReportsAsync();
            if (User.IsInRole("Staff") && !User.IsInRole("Admin"))
            {
                var staffName = AuthUser.GetCurrentUserName(User) ?? AuthUser.GetCurrentUserEmail(User);
                list = list
                    .Where(r => string.Equals(r.StaffName, staffName, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("reply")]
    public async Task<IActionResult> Reply([FromBody] ReportReplyRequest req)
    {
        var reportId = req.ResolveId();
        var adminReply = req.ResolveAdminReply();
        if (reportId is null)
        {
            return BadRequest(new { message = "ID bao cao khong hop le hoac bi thieu." });
        }
        if (string.IsNullOrWhiteSpace(adminReply))
        {
            return BadRequest(new { message = "Thieu noi dung phan hoi." });
        }

        try
        {
            var item = await supabase.ReplyReportAsync(reportId.Value, adminReply.Trim());
            return item is null
                ? NotFound(new { message = "Khong tim thay bao cao." })
                : Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
