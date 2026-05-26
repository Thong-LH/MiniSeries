using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using System;
using System.Threading.Tasks;

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

        // 1. API ĐĂNG KÝ HÓA ĐƠN (Gọi từ Trang Bảng Giá trước khi nhảy sang trang Checkout)
        [HttpPost("create-invoice")]
        public async Task<IActionResult> CreateInvoice([FromBody] InvoiceRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.UserId) || req.UserId.Length < 4)
    {
        return BadRequest(new { message = "Dữ liệu người dùng (UserId) không hợp lệ hoặc trống!" });
    }
            // Tạo mã code gửi tiền duy nhất bằng 4 ký tự cuối ID người dùng
            string safeCode = $"MGX{req.UserId.Substring(req.UserId.Length - 4).ToUpper()}";

            // Xóa các hóa đơn cũ chưa thanh toán của User này để tránh xung đột dữ liệu
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

        // 2. API WEBHOOK - ĐÂY LÀ ĐẦU NỐI ĐỂ NHẬN DỮ LIỆU TỪ PAYOS / CASSO / SEPAY KHI CÓ TIỀN THẬT VÀO NGÂN HÀNG
        [HttpPost("bank-webhook")]
        public async Task<IActionResult> ReceiveBankWebhook([FromBody] BankWebhookModel bankData)
        {
            // Tìm kiếm nội dung chuyển khoản xem có chứa mã PaymentCode (MGX....) không
            // Dịch vụ PayOS/Casso sẽ trả về chuỗi nội dung chuyển khoản trong biến description hoặc transactionDescription
            // Đổi bankData.Description thành bankData.Content
            string content = bankData.Content?.ToUpper() ?? "";

            // Truy vấn tìm hóa đơn chưa thanh toán trùng khớp mã code
            var order = await _context.PaymentOrders
                .FirstOrDefaultAsync(o => !o.IsCompleted && content.Contains(o.PaymentCode));

            if (order != null)
            {
                // Bước 1: Xác nhận hóa đơn đã thanh toán thành công
                order.IsCompleted = true;
                order.PaidAt = DateTime.UtcNow;

                // Bước 2: Truy vấn tài khoản người dùng thực tế trong database để cộng tài nguyên
                var profile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == order.UserId);
                if (profile != null)
                {
                    profile.Tokens += order.TokensAmount; // Cộng trực tiếp Token thật
                    // Nếu nạp gói lớn có thể nâng cấp hạng Tier tại đây
                    if (order.MoneyAmount >= 300000) profile.Tier = "Pro Max";
                    else if (order.MoneyAmount >= 150000) profile.Tier = "Plus";
                }

                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đã nhận tiền thực và cộng Token thành công!" });
            }

            return BadRequest("Nội dung chuyển khoản không khớp hóa đơn nào.");
        }

        // 3. API KIỂM TRA TRẠNG THÁI (Trang Frontend gọi liên tục mỗi 3 giây để mở Panel thành công)
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
    }

    // Các lớp định nghĩa DTO nhận dữ liệu
    public class InvoiceRequest
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
    public string Content { get; set; } // <--- SePay dùng trường 'Content' làm nội dung chuyển khoản ngân hàng
    public decimal TransferAmount { get; set; } // <--- SePay dùng trường này cho số tiền chuyển
    public string TransferType { get; set; }
    public string ReferenceCode { get; set; }
    public string Description { get; set; }
}
}