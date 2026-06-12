using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Authorize(Policy = "AuthenticatedUser")]
[Route("api/profile")]
public sealed class ProfileController(
    MiniSeriesDbContext dbContext,
    UserPlanQuotaService quotaService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }
        return await GetById(currentUserId.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }
        if (currentUserId.Value != id && !User.IsInRole("Staff") && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == id);
            if (profile is null)
            {
                return NotFound(new { message = "Khong tim thay ho so nguoi dung." });
            }

            var quota = await quotaService.GetSnapshotAsync(profile);

            return Ok(new
            {
                id = profile.Id,
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role),
                avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName)}",
                planName = quota.PlanName,
                tier = quota.PlanName,
                mangaMonthlyLimit = quota.MangaMonthlyLimit,
                usedMangaCount = quota.UsedMangaCount,
                remainingMangaCount = quota.RemainingMangaCount,
                videoMonthlyLimit = quota.VideoMonthlyLimit,
                usedVideoCount = quota.UsedVideoCount,
                remainingVideoCount = quota.RemainingVideoCount,
                monthlyGenerationLimit = quota.MonthlyGenerationLimit,
                usedGenerationCount = quota.UsedGenerationCount,
                remainingGenerationCount = quota.RemainingGenerationCount,
                currentPeriodStart = quota.CurrentPeriodStart,
                currentPeriodEnd = quota.CurrentPeriodEnd,
                tokens = quota.RemainingGenerationCount
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
