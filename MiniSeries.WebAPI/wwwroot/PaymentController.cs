using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace MiniSeries.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly YourDbContext _context; // Đổi tên thành DbContext thực tế của bạn

        public PaymentController(YourDbContext context)
        {
            _context = context;
        }

        // 1. API ĐĂNG KÝ HÓA ĐƠN
        [HttpPost("create-invoice")]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceInput req)
        {
            if (req == null || string.IsNullOrEmpty(req.UserId) || req.UserId.Length < 4)
            {
                return BadRequest(new { message = "Dữ liệu người dùng (UserId) không hợp lệ hoặc trống!" });
            }

            string safeCode = $"MGX{req.UserId.Substring(req.UserId.Length - 4).ToUpper()}";

            var oldOrders = _context.PaymentOrders.Where(o => o.UserId == req.UserId && !o.IsCompleted);
            _context.PaymentOrders.RemoveRange(oldOrders);

            var order = new PaymentOrder
            {
                UserId = req.UserId,
                PaymentCode = safeCode,
                TokensAmount = req.Tokens,
                MoneyAmount = req.Amount
            };

            _context.PaymentOrders.Add(order);
            await _context.SaveChangesAsync();

            return Ok(new { paymentCode = safeCode });
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
        public async Task<IActionResult> CheckStatus([FromQuery] string userId, [FromQuery] string code)
        {
            var order = await _context.PaymentOrders
                .FirstOrDefaultAsync(o => o.UserId == userId && o.PaymentCode == code);

            if (order != null && order.IsCompleted)
            {
                return Ok(new { isPaid = true });
            }
            return Ok(new { isPaid = false });
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