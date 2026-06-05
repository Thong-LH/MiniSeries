using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace MiniSeries.WebApi.Controllers
{
    [ApiController]
    [Route("api/admin")] // Định tuyến cứng chuẩn xác theo URL front-end đang gọi
    public class AdminController : ControllerBase
    {
        private readonly YourDbContext _context; // Hãy đổi 'YourDbContext' thành DbContext thực tế trong dự án của bạn

        public AdminController(YourDbContext context)
        {
            _context = context;
        }

        // 1. API lấy lịch sử thanh toán: GET http://localhost:5137/api/admin/payments
        [HttpGet("payments")]
        public async Task<IActionResult> GetAdminPayments()
        {
            try
            {
                var history = await _context.PaymentHistories
                    .OrderByDescending(h => h.CreatedAt)
                    .ToListAsync();
                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi lấy lịch sử", error = ex.Message });
            }
        }

        // 2. API lấy thống kê biểu đồ doanh thu: GET http://localhost:5137/api/admin/revenue-stats
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetAdminRevenueStats()
        {
            try
            {
                // Nhóm doanh thu theo tháng (chỉ tính giao dịch "Thành công") để vẽ biểu đồ
                var stats = await _context.PaymentHistories
                    .Where(h => h.Status == "Thành công")
                    .GroupBy(h => new { h.CreatedAt.Year, h.CreatedAt.Month })
                    .Select(g => new 
                    {
                        Month = $"{g.Key.Month}/{g.Key.Year}",
                        TotalAmount = g.Sum(h => h.Amount)
                    })
                    .OrderBy(s => s.Month)
                    .ToListAsync();

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi hệ thống khi tính doanh thu", error = ex.Message });
            }
        }
    }
}