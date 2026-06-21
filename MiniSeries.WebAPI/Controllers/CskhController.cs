using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using System;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/admin/cskh")]
[Authorize(Policy = "StaffOrAdmin")]
public class CskhController : ControllerBase
{
    private readonly MiniSeriesDbContext _dbContext;
    private readonly EmailSettings _emailSettings;

    public CskhController(
        MiniSeriesDbContext dbContext,
        IOptions<EmailSettings> emailSettings)
    {
        _dbContext = dbContext;
        _emailSettings = emailSettings.Value;
    }

    // 🚀 API 1: TIẾN HÀNH GỬI MAIL VÀ LƯU VÀO DATABASE
    [HttpPost("send")]
    public async Task<IActionResult> SendCskhEmail([FromBody] SendEmailRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CustomerEmail) || string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Vui lòng nhập Email nhận và Nội dung thư." });
        }

        try
        {
            // 1. Lấy Role của người đăng nhập từ Token (Admin/Staff)
            var currentRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Staff";

            var subject = string.IsNullOrWhiteSpace(req.Subject) ? "Hỗ trợ khách hàng từ Thousand Sunsilk" : req.Subject;

            // 2. Sử dụng EF Core để lưu vào database trước
            var messageLog = new CskhMessage
            {
                Id = Guid.NewGuid(),
                CustomerEmail = req.CustomerEmail,
                Subject = subject,
                Content = req.Content,
                SenderRole = currentRole,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.CskhMessages.Add(messageLog);
            await _dbContext.SaveChangesAsync();

            // 3. Thực hiện gửi mail bất đồng bộ ở background
            if (!string.IsNullOrWhiteSpace(_emailSettings.SenderEmail) && !string.IsNullOrWhiteSpace(_emailSettings.AppPassword))
            {
                var customerEmail = req.CustomerEmail;
                var emailContent = req.Content;
                var emailSubject = subject;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        using (var smtpClient = new SmtpClient(_emailSettings.SmtpServer ?? "smtp.gmail.com"))
                        {
                            smtpClient.Port = int.TryParse(_emailSettings.Port, out var p) ? p : 587;
                            smtpClient.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.AppPassword);
                            smtpClient.EnableSsl = true;

                            var mailMessage = new MailMessage
                            {
                                From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName ?? "Thousand Sunsilk"),
                                Subject = emailSubject,
                                Body = emailContent,
                                IsBodyHtml = false
                            };
                            mailMessage.To.Add(customerEmail);

                            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                            await smtpClient.SendMailAsync(mailMessage, cts.Token);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[SMTP Background Error] Failed to send CSKH email to {customerEmail}: {ex.Message}");
                    }
                });
            }

            return Ok(new { message = $"Đã ghi nhận nhật ký và tiến hành gửi thư CSKH thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Hệ thống gặp lỗi lưu nhật ký hoặc xử lý gửi: {ex.Message}", errorDetail = ex.ToString() });
        }
    }

    // 🚀 API 2: LẤY LỊCH SỬ CÁC THƯ ĐÃ GỬI
    [HttpGet("history")]
    public async Task<IActionResult> GetCskhHistory()
    {
        try
        {
            var list = await _dbContext.CskhMessages
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(list.Select(h => new
            {
                id = h.Id,
                customer_email = h.CustomerEmail,
                subject = h.Subject,
                content = h.Content,
                sender_role = h.SenderRole,
                created_at = h.CreatedAt
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Không thể tải lịch sử: " + ex.Message });
        }
    }
}

public class SendEmailRequest
{
    [System.Text.Json.Serialization.JsonPropertyName("customerEmail")]
    public string CustomerEmail { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("subject")]
    public string Subject { get; set; } = "";

    [System.Text.Json.Serialization.JsonPropertyName("content")]
    public string Content { get; set; } = "";
}