using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Infrastructure.ExternalServices;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(SupabaseRestService supabaseDb) : ControllerBase
{
    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        try
        {
            var customers = await supabaseDb.ListCustomersAsync();
            return Ok(customers);
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
                .Select(s => new
                {
                    id = s.Id,
                    email = s.Email,
                    fullName = s.FullName,
                    role = s.Role,
                    createdAt = s.CreatedAt == default ? DateTime.UtcNow : s.CreatedAt
                })
                .ToList();
            return Ok(safeList);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Không thể tải danh sách nhân viên: " + ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("payment-history")]
    [HttpGet("payments")]
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
    [HttpGet("revenue-stats")]
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
}
