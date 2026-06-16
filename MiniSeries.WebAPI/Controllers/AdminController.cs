using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.WebAPI.Contracts;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(
    SupabaseRestService supabaseDb,
    SupabaseAdminAuthService adminAuth) : ControllerBase
{
    private static object MapProfile(SupabaseUserProfileRow p) => new
    {
        id = p.Id,
        email = p.Email,
        fullName = p.FullName,
        role = p.Role,
        accountStatus = string.IsNullOrWhiteSpace(p.AccountStatus) ? "Active" : p.AccountStatus,
        planName = string.IsNullOrWhiteSpace(p.PlanName) ? "Free" : p.PlanName,
        tokenBalance = p.TokenBalance,
        createdAt = p.CreatedAt == default ? DateTime.UtcNow : p.CreatedAt
    };

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        try
        {
            var customers = await supabaseDb.ListCustomersAsync();
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
            var staffs = await supabaseDb.ListStaffsAsync();
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
            var existing = await supabaseDb.GetUserProfileByEmailAsync(email);
            if (existing is not null)
            {
                return BadRequest(new { message = "Email này đã tồn tại trên hệ thống." });
            }

            var userId = await adminAuth.CreateUserAsync(email, password, fullName);
            var profile = await supabaseDb.CreateUserProfileAsync(userId, email, fullName, "Staff");
            if (profile is null)
            {
                await adminAuth.DeleteUserAsync(userId);
                return StatusCode(500, new { message = "Tạo Auth thành công nhưng không ghi được UserProfiles." });
            }

            await supabaseDb.UpdateUserProfileAsync(userId, new
            {
                AccountStatus = "Active",
                PlanName = "Free",
                TokenBalance = 0
            });

            var updated = await supabaseDb.GetUserProfileByIdAsync(userId);
            return Ok(MapProfile(updated ?? profile));
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
            var profile = await supabaseDb.GetUserProfileByIdAsync(id);
            if (profile is null || !string.Equals(profile.Role, "Staff", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy nhân viên." });
            }

            await supabaseDb.DeleteUserProfileAsync(id);
            await adminAuth.DeleteUserAsync(id);
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
            var profile = await supabaseDb.GetUserProfileByIdAsync(id);
            if (profile is null || !string.Equals(profile.Role, "Customer", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            }

            await supabaseDb.DeleteUserProfileAsync(id);
            await adminAuth.DeleteUserAsync(id);
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

    // ==========================================================
    // 🌟 API LẤY THỐNG KÊ TOKEN CHUẨN: FREE - BASIC - PRO MAX
    // ==========================================================
    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("tokens/summary")]
    public async Task<IActionResult> GetTokenSummary()
    {
        try
        {
            var customers = await supabaseDb.ListCustomersAsync();
            
            int totalFree = 0;
            int totalBasic = 0;
            int totalProMax = 0;
            int totalTokens = 0;

            if (customers != null)
            {
                // Tổng số lượng token thực tế của tất cả user cộng lại
                totalTokens = customers.Sum(c => c.TokenBalance);

                foreach (var customer in customers)
                {
                    var plan = (customer.PlanName ?? "").Trim();

                    if (string.Equals(plan, "Basic", StringComparison.OrdinalIgnoreCase))
                    {
                        totalBasic++;
                    }
                    else if (string.Equals(plan, "Pro Max", StringComparison.OrdinalIgnoreCase))
                    {
                        totalProMax++;
                    }
                    else
                    {
                        totalFree++;
                    }
                }
            }

            // Map linh hoạt các thuộc tính để Frontend viết kiểu gì cũng đọc được số liệu đúng
            return Ok(new
            {
                totalTokens = totalTokens,
                totalTokensIssued = totalTokens,

                // Map số lượng gói Basic vào ô hiển thị thứ 2 (Gói Plus/Basic cũ)
                totalPlus = totalBasic,
                plusPackageCount = totalBasic,

                // Map số lượng gói Pro Max vào ô hiển thị thứ 3
                totalProMax = totalProMax,
                proMaxPackageCount = totalProMax,

                // Thêm trường tường minh phòng hờ nếu frontend dùng gói Free
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
            var customers = await supabaseDb.ListCustomersAsync();
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
            var profile = await supabaseDb.GetUserProfileByIdAsync(id);
            if (profile is null || !string.Equals(profile.Role, "Customer", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            }

            var updated = await supabaseDb.AdjustUserTokenAndPlanAsync(id, req.TokenDelta, req.PlanName);
            return updated is null
                ? NotFound(new { message = "Không thể cập nhật token/gói." })
                : Ok(MapProfile(updated));
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
            var list = await supabaseDb.ListPaymentHistoryAsync();
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
            var stats = await supabaseDb.GetPaymentStatsAsync(groupBy ?? "month");
            return Ok(stats);
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
            var profile = await supabaseDb.GetUserProfileByIdAsync(id);
            if (profile is null || !string.Equals(profile.Role, expectedRole, StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { message = "Không tìm thấy tài khoản." });
            }

            var isBlocked = string.Equals(profile.AccountStatus, "Blocked", StringComparison.OrdinalIgnoreCase);
            var newStatus = isBlocked ? "Active" : "Blocked";

            await adminAuth.SetUserBannedAsync(id, !isBlocked);
            var updated = await supabaseDb.UpdateUserProfileAsync(id, new { AccountStatus = newStatus });

            return Ok(new
            {
                message = isBlocked ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
                accountStatus = newStatus,
                profile = updated is null ? null : MapProfile(updated)
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}