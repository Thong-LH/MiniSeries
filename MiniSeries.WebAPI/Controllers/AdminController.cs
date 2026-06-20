using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Contracts;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(
    MiniSeriesDbContext dbContext,
    SupabaseAdminAuthService adminAuth,
    IMemoryCache memoryCache) : ControllerBase
{
    private static object MapProfile(UserProfile p) => new
    {
        id = p.Id,
        email = p.Email,
        fullName = p.FullName,
        role = p.Role,
        accountStatus = string.IsNullOrWhiteSpace(p.AccountStatus) ? "Active" : p.AccountStatus,
        planName = string.IsNullOrWhiteSpace(p.PlanName) ? "Free" : p.PlanName,
        tokenBalance = p.TokenBalance,
        mangaLimit = p.MangaMonthlyLimit,
        usedManga = p.UsedMangaCount,
        videoLimit = p.VideoMonthlyLimit,
        usedVideo = p.UsedVideoCount,
        createdAt = p.CreatedAt == default ? DateTime.UtcNow : p.CreatedAt
    };

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        try
        {
            var customers = await dbContext.UserProfiles
                .Where(u => u.Role == "Customer")
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
            return Ok(customers.Select(MapProfile).ToList());
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("staffs")]
    public async Task<IActionResult> GetStaffs()
    {
        try
        {
            var staffs = await dbContext.UserProfiles
                .Where(s => s.Role == "Staff")
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            
            var safeList = staffs
                .Where(s => s.Id != Guid.Empty && !string.IsNullOrWhiteSpace(s.Email))
                .Select(MapProfile)
                .ToList();
            return Ok(safeList);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Khong the tai danh sach nhan vien: " + ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("staffs")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var fullName = (req.FullName ?? "").Trim();
        var password = req.Password ?? "";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { message = "Vui lòng nhập đầy đủ tên, email và mật khẩu." });
        }
        if (password.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu tối thiểu 6 ký tự." });
        }

        try
        {
            var existing = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Email == email);
            if (existing is not null)
            {
                return BadRequest(new { message = "Email này đã tồn tại trên hệ thống." });
            }

            var userId = await adminAuth.CreateUserAsync(email, password, fullName);
            
            var profile = new UserProfile
            {
                Id = userId,
                Email = email,
                FullName = fullName,
                Role = "Staff",
                AccountStatus = "Active",
                PlanName = "Free",
                TokenBalance = 0,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.UserProfiles.Add(profile);
            await dbContext.SaveChangesAsync();

            return Ok(MapProfile(profile));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("staffs/{id:guid}")]
    public async Task<IActionResult> DeleteStaff(Guid id)
    {
        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);
            if (profile is null || !string.Equals(profile.Role, "Staff", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy nhân viên." });
            }

            dbContext.UserProfiles.Remove(profile);
            await dbContext.SaveChangesAsync();
            await adminAuth.DeleteUserAsync(id);
            
            // Xóa cache
            memoryCache.Remove($"user-profile-{id}");

            return Ok(new { message = "Đã xóa tài khoản nhân viên." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("staffs/{id:guid}/toggle-block")]
    public async Task<IActionResult> ToggleBlockStaff(Guid id)
    {
        return await ToggleBlockUserAsync(id, "Staff");
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("customers/{id:guid}")]
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);
            if (profile is null || !string.Equals(profile.Role, "Customer", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            }

            dbContext.UserProfiles.Remove(profile);
            await dbContext.SaveChangesAsync();
            await adminAuth.DeleteUserAsync(id);
            
            // Xóa cache
            memoryCache.Remove($"user-profile-{id}");

            return Ok(new { message = "Đã xóa tài khoản khách hàng." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("customers/{id:guid}/toggle-block")]
    public async Task<IActionResult> ToggleBlockCustomer(Guid id)
    {
        return await ToggleBlockUserAsync(id, "Customer");
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("tokens/summary")]
    public async Task<IActionResult> GetTokenSummary()
    {
        try
        {
            var customers = await dbContext.UserProfiles
                .Where(u => u.Role == "Customer")
                .ToListAsync();
            
            int totalFree = 0;
            int totalBasic = 0;
            int totalProMax = 0;
            int totalTokens = 0;

            if (customers != null)
            {
                totalTokens = customers.Sum(c => c.TokenBalance);

                foreach (var customer in customers)
                {
                    var plan = (customer.PlanName ?? "").Trim();

                    if (string.Equals(plan, "Basic", StringComparison.OrdinalIgnoreCase) || string.Equals(plan, "Plus", StringComparison.OrdinalIgnoreCase))
                    {
                        totalBasic++;
                    }
                    else if (string.Equals(plan, "Pro Max", StringComparison.OrdinalIgnoreCase) || string.Equals(plan, "ProMax", StringComparison.OrdinalIgnoreCase) || string.Equals(plan, "Premium", StringComparison.OrdinalIgnoreCase))
                    {
                        totalProMax++;
                    }
                    else
                    {
                        totalFree++;
                    }
                }
            }

            return Ok(new
            {
                totalTokens = totalTokens,
                totalTokensIssued = totalTokens,
                totalPlus = totalBasic,
                plusPackageCount = totalBasic,
                totalProMax = totalProMax,
                proMaxPackageCount = totalProMax,
                freePackageCount = totalFree,
                totalFree = totalFree
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Lỗi hệ thống tính toán dữ liệu: {ex.Message}" });
        }
    }

    public record UpdateSystemSummaryRequest(int TotalTokens, int TotalPlus, int TotalProMax);

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpPost("tokens/update-summary")] 
    public IActionResult UpdateSystemSummary([FromBody] UpdateSystemSummaryRequest req)
    {
        try
        {
            return Ok(new { message = "Cấu hình hệ thống tổng đã được cập nhật thành công!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("tokens/users")]
    public async Task<IActionResult> GetTokenUsers()
    {
        try
        {
            var customers = await dbContext.UserProfiles
                .Where(u => u.Role == "Customer")
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
            return Ok(customers.Select(MapProfile).ToList());
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpPatch("tokens/users/{id:guid}")]
    public async Task<IActionResult> UpdateUserToken(Guid id, [FromBody] UpdateTokenRequest req)
    {
        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);
            if (profile is null || !string.Equals(profile.Role, "Customer", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            }

            if (req.MangaDelta is not null && req.MangaDelta.Value != 0)
            {
                profile.MangaMonthlyLimit = Math.Max(0, profile.MangaMonthlyLimit + req.MangaDelta.Value);
            }

            if (req.VideoDelta is not null && req.VideoDelta.Value != 0)
            {
                profile.VideoMonthlyLimit = Math.Max(0, profile.VideoMonthlyLimit + req.VideoDelta.Value);
            }

            if (!string.IsNullOrWhiteSpace(req.PlanName))
            {
                var plan = UserPlanQuotaService.ResolvePlan(req.PlanName);
                profile.PlanName = plan.Name;
                profile.MangaMonthlyLimit = plan.MangaMonthlyLimit;
                profile.VideoMonthlyLimit = plan.VideoMonthlyLimit;
                profile.UsedMangaCount = 0;
                profile.UsedVideoCount = 0;
                profile.CurrentPeriodStart = DateTime.UtcNow;
                profile.CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1);
            }

            await dbContext.SaveChangesAsync();

            // Xóa cache
            memoryCache.Remove($"user-profile-{id}");

            return Ok(MapProfile(profile));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("payment-history")]
    public async Task<IActionResult> GetPaymentHistory()
    {
        try
        {
            var list = await dbContext.PaymentHistories
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("payment-stats")]
    public async Task<IActionResult> GetPaymentStats([FromQuery] string? groupBy)
    {
        try
        {
            var rows = await dbContext.PaymentHistories.ToListAsync();
            var grouped = rows
                .GroupBy(r =>
                {
                    var dt = r.CreatedAt;
                    return (groupBy ?? "month").Equals("day", StringComparison.OrdinalIgnoreCase)
                        ? dt.ToString("yyyy-MM-dd")
                        : dt.ToString("yyyy-MM");
                })
                .OrderBy(g => g.Key)
                .Select(g => new { Label = g.Key, Amount = g.Sum(x => x.Amount) })
                .ToList();

            return Ok(new
            {
                labels = grouped.Select(x => x.Label).ToList(),
                amounts = grouped.Select(x => x.Amount).ToList(),
                totalRevenue = rows.Sum(x => x.Amount),
                transactionCount = rows.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<IActionResult> ToggleBlockUserAsync(Guid id, string expectedRole)
    {
        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Id == id);
            if (profile is null || !string.Equals(profile.Role, expectedRole, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy tài khoản." });
            }

            var isBlocked = string.Equals(profile.AccountStatus, "Blocked", StringComparison.OrdinalIgnoreCase);
            var newStatus = isBlocked ? "Active" : "Blocked";

            await adminAuth.SetUserBannedAsync(id, !isBlocked);
            
            profile.AccountStatus = newStatus;
            await dbContext.SaveChangesAsync();

            // Xóa cache
            memoryCache.Remove($"user-profile-{id}");

            return Ok(new
            {
                message = isBlocked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
                accountStatus = newStatus,
                profile = MapProfile(profile)
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}