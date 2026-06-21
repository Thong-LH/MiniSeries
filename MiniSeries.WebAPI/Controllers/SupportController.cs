using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;
using System;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/support")]
public sealed class SupportController(
    MiniSeriesDbContext dbContext,
    IOptions<EmailSettings> emailSettings) : ControllerBase
{
    private readonly EmailSettings _emailSettings = emailSettings.Value;
    [Authorize(Policy = "AuthenticatedUser")]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] SupportCreateRequest req)
    {
        var customerEmail = AuthUser.GetCurrentUserEmail(User);
        if (string.IsNullOrWhiteSpace(customerEmail) || string.IsNullOrWhiteSpace(req.Content))
        {
            return BadRequest(new { message = "Thieu email hoac noi dung yeu cau." });
        }

        try
        {
            var item = new SupportRequest
            {
                Id = Guid.NewGuid(),
                CustomerEmail = customerEmail.Trim(),
                Content = req.Content.Trim(),
                Reply = "",
                Status = "Chờ trả lời",
                CreatedAt = DateTime.UtcNow
            };

            dbContext.SupportRequests.Add(item);
            await dbContext.SaveChangesAsync();

            return Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpGet("list")]
    public async Task<IActionResult> List()
    {
        try
        {
            var list = await dbContext.SupportRequests
                .OrderBy(s => s.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "StaffOrAdmin")]
    [HttpPost("reply")]
    public async Task<IActionResult> Reply([FromBody] SupportReplyRequest req)
    {
        var supportId = req.ResolveId();
        var replyText = req.ResolveReply();
        if (supportId is null)
        {
            return BadRequest(new { message = "ID yeu cau tu van khong hop le hoac bi thieu." });
        }
        if (string.IsNullOrWhiteSpace(replyText))
        {
            return BadRequest(new { message = "Thieu noi dung phan hoi." });
        }

        try
        {
            var item = await dbContext.SupportRequests.FirstOrDefaultAsync(s => s.Id == supportId.Value);
            if (item is null)
            {
                return NotFound(new { message = "Khong tim thay yeu cau tu van." });
            }

            item.Reply = replyText.Trim();
            item.Status = "Đã trả lời";
            
            await dbContext.SaveChangesAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(_emailSettings.SenderEmail) && !string.IsNullOrWhiteSpace(_emailSettings.AppPassword))
                {
                    using (var smtpClient = new SmtpClient(_emailSettings.SmtpServer ?? "smtp.gmail.com"))
                    {
                        smtpClient.Port = int.TryParse(_emailSettings.Port, out var port) ? port : 587;
                        smtpClient.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.AppPassword);
                        smtpClient.EnableSsl = true;

                        var mailMessage = new MailMessage
                        {
                            From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName ?? "Mini Series Learning"),
                            Subject = $"Phản hồi yêu cầu tư vấn - Phiếu #{item.Id}",
                            Body = $"Chào bạn,\n\nYêu cầu hỗ trợ của bạn với nội dung:\n\"{item.Content}\"\n\nĐã được ban quản trị phản hồi:\n\"{item.Reply}\"\n\nTrân trọng,\nĐội ngũ hỗ trợ {_emailSettings.SenderName ?? "Mini Series"}.",
                            IsBodyHtml = false
                        };
                        mailMessage.To.Add(item.CustomerEmail);

                        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                        await smtpClient.SendMailAsync(mailMessage, cts.Token);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SMTP Error] Failed to send support reply email to {item.CustomerEmail}: {ex.Message}");
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
