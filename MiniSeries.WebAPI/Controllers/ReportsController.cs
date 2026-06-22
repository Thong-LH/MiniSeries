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
[Route("api/report")]
public sealed class ReportsController(MiniSeriesDbContext dbContext) : ControllerBase
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
            var item = new StaffReport
            {
                Id = Guid.NewGuid(),
                StaffName = staffName.Trim(),
                Content = req.Content.Trim(),
                AdminReply = "",
                Status = "Chờ duyệt",
                CreatedAt = DateTime.UtcNow
            };

            dbContext.StaffReports.Add(item);
            await dbContext.SaveChangesAsync();

            return Ok(item);
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
            var list = await dbContext.StaffReports
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();

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
            var item = await dbContext.StaffReports.FirstOrDefaultAsync(r => r.Id == reportId.Value);
            if (item is null)
            {
                return NotFound(new { message = "Khong tim thay bao cao." });
            }

            item.AdminReply = adminReply.Trim();
            item.Status = "Đã hoàn thành";

            await dbContext.SaveChangesAsync();

            return Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
