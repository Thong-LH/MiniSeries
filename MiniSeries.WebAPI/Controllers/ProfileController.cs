using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Authorize(Policy = "AuthenticatedUser")]
[Route("api/profile")]
public sealed class ProfileController(
    SupabaseRestService supabaseDb,
    UserPlanQuotaService quotaService) : ControllerBase
{
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
            var profile = await supabaseDb.GetUserProfileByIdAsync(id);
            if (profile is null)
            {
                return NotFound(new { message = "Khong tim thay ho so nguoi dung." });
            }

            var quota = await quotaService.GetSnapshotAsync(id);

            return Ok(new
            {
                id = profile.Id,
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role),
                avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName)}",
                planName = quota.PlanName,
                tier = quota.PlanName,
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
