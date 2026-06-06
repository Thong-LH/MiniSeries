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
            return Ok(staffs);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Khong the tai danh sach nhan vien: " + ex.Message });
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
}
