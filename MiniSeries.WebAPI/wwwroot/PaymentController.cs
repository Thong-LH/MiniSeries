using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using System;
using System.Threading.Tasks;
using System.Linq;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace MiniSeries.WebApi.Controllers
{
    [ApiController]
    [Route("api/admin")] // Định tuyến cứng xử lý riêng cho trang dashboard admin
    public class AdminController : ControllerBase
    {
        private readonly YourDbContext _context; // Đổi YourDbContext thành tên DbContext thật của bạn

        public AdminController(YourDbContext context)
        {
            _context = context;
        }

        // Khớp chính xác endpoint: GET http://localhost:5137/api/admin/payments
        [HttpGet("payments")]
        public async Task<IActionResult> GetPayments()
        {
            var history = await _context.PaymentHistories
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();
            return Ok(history);
        }

        // Khớp chính xác endpoint: GET http://localhost:5137/api/admin/revenue-stats
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetRevenueStats()
        {
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

        // 2. API WEBHOOK NHẬN DỮ LIỆU TỪ NGÂN HÀNG THỰC
        [HttpPost("bank-webhook")]
        public async Task<IActionResult> ReceiveBankWebhook([FromBody] BankWebhookModel bankData)
        {
            string content = bankData.Content?.ToUpper() ?? "";

            var order = await _context.PaymentOrders
                .FirstOrDefaultAsync(o => !o.IsCompleted && content.Contains(o.PaymentCode));

            if (order != null)
            {
                order.IsCompleted = true;
                order.PaidAt = DateTime.UtcNow;

                var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == order.UserId);
                if (profile != null)
                {
                    profile.Tokens += order.TokensAmount;
                    if (order.MoneyAmount >= 300000) profile.Tier = "Pro Max";
                    else if (order.MoneyAmount >= 150000) profile.Tier = "Plus";
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đã nhận tiền thực và cộng Token thành công!" });
            }

            return BadRequest("Nội dung chuyển khoản không khớp hóa đơn nào.");
        }

        // 3. API KIỂM TRA TRẠNG THÁI
       [HttpGet("check-status")]
public async Task<IActionResult> CheckStatus(
    [FromQuery] string userId, 
    [FromQuery] string code,
    [FromQuery] string plan,     // <--- NHẬN ĐỘNG TÊN GÓI (Ví dụ: "Plus", "Pro Max")
    [FromQuery] decimal amount)  // <--- NHẬN ĐỘNG SỐ TIỀN (Ví dụ: 150000, 300000)
{
   // 1. Kiểm tra xem tài khoản người dùng có thực sự tồn tại trong DB không
var user = await _context.Users.FindAsync(userId);
if (user == null)
{
    // Nếu không tìm thấy User, trả về lỗi luôn chứ không gán email mặc định nữa
    return BadRequest(new { success = false, message = "Không tìm thấy thông tin tài khoản người mua hợp lệ." });
}

// 2. Tự động tính toán số lượng Token động dựa theo số tiền gửi lên
int tokensCalculated = (int)amount; 

// 3. Gán dữ liệu chuẩn từ đối tượng user đã tìm thấy trong Database
var history = new PaymentHistory
{
    UserId = userId,
    UserEmail = user.Email, // <--- LẤY ĐÚNG EMAIL THẬT CỦA USER TRONG DB, KHÔNG HARDCODE NỮA!
    PaymentCode = code,
    Amount = amount,
    PlanName = plan,
    TokensReceived = tokensCalculated,
    CreatedAt = DateTime.UtcNow,
    Status = "Thành công"
};

_context.PaymentHistories.Add(history);

// Cộng token thực tế vào tài khoản của user đó
user.Tokens += tokensCalculated; 

await _context.SaveChangesAsync();

return Ok(new { success = true, message = "Thanh toán thành công và đã ghi nhận lịch sử." });
}
        // 4. API PROXY NỘI BỘ - GIÚP FRONTEND ĐỌC WEBHOOK.SITE KHÔNG BỊ CORS
        [HttpGet("webhook-gateway")]
        public async Task<IActionResult> GetWebhookData()
        {
            try
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    var url = "https://webhook.site/token/ee7acda5-ed3d-42df-bade-39d0ce0cb17a/requests?sorting=newest";
                    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (.NET Proxy)");
                    
                    var response = await client.GetAsync(url);
                    if (response.IsSuccessStatusCode)
                    {
                        var jsonString = await response.Content.ReadAsStringAsync();
                        return Content(jsonString, "application/json");
                    }
                    return StatusCode((int)response.StatusCode, "Lỗi khi kết nối webhook.site");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // API 1: Lấy lịch sử của 1 Khách hàng cụ thể (dùng cho trang Hồ sơ khách hàng)
[HttpGet("history/user/{userId}")]
public async Task<IActionResult> GetUserHistory(string userId)
{
    var history = await _context.PaymentHistories
        .Where(h => h.UserId == userId)
        .OrderByDescending(h => h.CreatedAt)
        .ToListAsync();
    return Ok(history);
}

// API 2: Lấy TOÀN BỘ lịch sử (dùng cho Admin xem danh sách & vẽ biểu đồ)
[HttpGet("history/admin")]
public async Task<IActionResult> GetAdminHistory()
{
    var history = await _context.PaymentHistories
        .OrderByDescending(h => h.CreatedAt)
        .ToListAsync();
    return Ok(history);
}

// =====================================================================
// ĐOẠN CODE THÊM MỚI: PHỤC VỤ TRANG DASHBOARD ADMIN (SỬA LỖI HTTP 404)
// =====================================================================

// 1. Khớp với đường dẫn front-end cần: /api/payment/admin/payments
// Mẹo: Nếu front-end bắt buộc phải gọi /api/admin/..., xem mục lưu ý phía dưới
[HttpGet("admin/payments")]
public async Task<IActionResult> GetAdminPaymentsDashboard()
{
    var history = await _context.PaymentHistories
        .OrderByDescending(h => h.CreatedAt)
        .ToListAsync();
    return Ok(history);
}

// 2. Khớp với đường dẫn front-end cần: /api/payment/admin/revenue-stats
[HttpGet("admin/revenue-stats")]
public async Task<IActionResult> GetAdminRevenueStats()
{
    // Nhóm doanh thu theo tháng (chỉ tính giao dịch "Thành công") để trả về cho biểu đồ
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
    }

    public class CreateInvoiceInput
    {
        public string UserId { get; set; }
        public int Tokens { get; set; }
        public decimal Amount { get; set; }
    }

    public class BankWebhookModel
    {
        public long Id { get; set; }
        public string Gateway { get; set; }
        public DateTime TransactionDate { get; set; }
        public string AccountNumber { get; set; }
        public string Code { get; set; }
        public string Content { get; set; } 
        public decimal TransferAmount { get; set; } 
        public string TransferType { get; set; }
        public string ReferenceCode { get; set; }
        public string Description { get; set; }
    }
}