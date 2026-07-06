using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class AnalyticsController(MiniSeriesDbContext dbContext) : ControllerBase
{
    [HttpPost("track")]
    public async Task<IActionResult> Track([FromBody] TrackRequest req)
    {
        try
        {
            var currentUserId = AuthUser.GetCurrentUserId(User);
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

            // If forwarded by a proxy (like ngrok, Cloudflare, etc.)
            if (HttpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                ipAddress = forwardedFor.ToString().Split(',')[0].Trim();
            }

            var log = new TrafficLog
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId?.ToString(),
                Path = req.Path ?? "/",
                DeviceType = req.DeviceType ?? "Web",
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.TrafficLogs.Add(log);
            await dbContext.SaveChangesAsync();

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("traffic-stats")]
    public async Task<IActionResult> GetTrafficStats([FromQuery] string? groupBy)
    {
        try
        {
            var logs = await dbContext.TrafficLogs.AsNoTracking().ToListAsync();

            var grouped = logs
                .GroupBy(r =>
                {
                    var dt = r.CreatedAt.ToLocalTime();
                    return (groupBy ?? "month").Equals("day", StringComparison.OrdinalIgnoreCase)
                        ? dt.ToString("yyyy-MM-dd")
                        : dt.ToString("yyyy-MM");
                })
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    Label = g.Key,
                    PageViews = g.Count(),
                    UniqueVisitors = g.Select(x => x.IpAddress).Distinct().Count()
                })
                .ToList();

            return Ok(new
            {
                labels = grouped.Select(x => x.Label).ToList(),
                pageViews = grouped.Select(x => x.PageViews).ToList(),
                uniqueVisitors = grouped.Select(x => x.UniqueVisitors).ToList(),
                totalPageViews = logs.Count,
                totalUniqueVisitors = logs.Select(x => x.IpAddress).Distinct().Count()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public sealed class TrackRequest
{
    public string? Path { get; set; }
    public string? DeviceType { get; set; }
}
