using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using MiniSeries.Infrastructure.ExternalServices; 
using MiniSeries.Infrastructure.Options; 
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/admin/cskh")]
[Authorize(Policy = "StaffOrAdmin")]
public class CskhController : ControllerBase
{
    private readonly SupabaseRestService _supabaseRestService;
    private readonly EmailSettings _emailSettings;
    private readonly string _supabaseUrl;
    private readonly string _supabaseKey;

    public CskhController(
        SupabaseRestService supabaseRestService, 
        IConfiguration configuration, 
        IOptions<EmailSettings> emailSettings)
    {
        _supabaseRestService = supabaseRestService;
        _emailSettings = emailSettings.Value;
        
        _supabaseUrl = configuration["Supabase:Url"] ?? "";
        _supabaseKey = configuration["Supabase:AnonKey"] ?? "";
    }

    // 🚀 API 1: TIẾN HÀNH GỬI MAIL VÀ LƯU VÀO SUPABASE
    [HttpPost("send")]
    public async Task<IActionResult> SendCskhEmail([FromBody] SendEmailRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CustomerEmail) || string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Vui lòng nhập Email nhận và Nội dung thư." });
        }

        try
        {
            // 1. Thực hiện gửi mail bằng hòm thư công ty Thousand Sunsilk
            using (var smtpClient = new SmtpClient(_emailSettings.SmtpServer))
            {
                smtpClient.Port = int.TryParse(_emailSettings.Port, out var p) ? p : 587;
                smtpClient.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.AppPassword);
                smtpClient.EnableSsl = true;

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
                    Subject = string.IsNullOrWhiteSpace(req.Subject) ? "Hỗ trợ khách hàng từ Thousand Sunsilk" : req.Subject,
                    Body = req.Content,
                    IsBodyHtml = false
                };
                mailMessage.To.Add(req.CustomerEmail);

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                await smtpClient.SendMailAsync(mailMessage, cts.Token);
            }

            // 2. Lấy Role của người đăng nhập từ Token (Admin/Staff)
            var currentRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Staff";

            // 3. Sử dụng HttpClient bắn trực tiếp lên Database REST API của Supabase để ghi nhận lịch sử
            using (var httpClient = new HttpClient())
            {
                var targetUrl = $"{_supabaseUrl.TrimEnd('/')}/rest/v1/cskh_messages";
                
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("apikey", _supabaseKey);
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseKey}");

                var logData = new
                {
                    customer_email = req.CustomerEmail,
                    subject = req.Subject,
                    content = req.Content,
                    sender_role = currentRole
                };

                var response = await httpClient.PostAsJsonAsync(targetUrl, logData);
                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    return StatusCode((int)response.StatusCode, new { message = "Gửi mail OK nhưng lưu lịch sử lỗi: " + errContent });
                }
            }

            return Ok(new { message = $"Đã gửi thư hỗ trợ thành công từ tổng đài {_emailSettings.SenderName}!" });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(500, new { message = "Lỗi gửi Email CSKH: Quá thời gian chờ (10 giây). Có thể do cổng SMTP 587 bị chặn hoặc cấu hình sai." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Hệ thống gặp lỗi: {ex.Message}", errorDetail = ex.ToString() });
        }
    }

    // 🚀 API 2: LẤY LỊCH SỬ CÁC THƯ ĐÃ GỬI
    [HttpGet("history")]
    public async Task<IActionResult> GetCskhHistory()
    {
        try
        {
            using (var httpClient = new HttpClient())
            {
                var targetUrl = $"{_supabaseUrl.TrimEnd('/')}/rest/v1/cskh_messages?select=*";
                
                httpClient.DefaultRequestHeaders.Clear();
                httpClient.DefaultRequestHeaders.Add("apikey", _supabaseKey);
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_supabaseKey}");

                var response = await httpClient.GetAsync(targetUrl);
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { message = "Không thể tải lịch sử từ Supabase." });
                }

                var jsonResult = await response.Content.ReadFromJsonAsync<object>();
                return Ok(jsonResult);
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Không thể tải lịch sử: " + ex.Message });
        }
    }
}

// ĐÃ SỬA: Chuyển từ Record sang Class thường để gán thuộc tính JsonPropertyName hợp lệ 100%
public class SendEmailRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("subject")]
    public string Subject { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public string Content { get; set; } = "";
}