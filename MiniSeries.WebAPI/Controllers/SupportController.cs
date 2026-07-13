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
    [HttpGet("my")]
    public async Task<IActionResult> MyTickets()
    {
        var customerEmail = AuthUser.GetCurrentUserEmail(User);
        if (string.IsNullOrWhiteSpace(customerEmail))
        {
            return BadRequest(new { message = "Thieu email xac thuc." });
        }

        try
        {
            var list = await dbContext.SupportRequests
                .AsNoTracking()
                .Where(s => s.CustomerEmail == customerEmail.Trim())
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

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
            // 1. Lấy danh sách Staff đang hoạt động (Hỗ trợ cả chữ hoa/thường)
            var staffMembers = await dbContext.UserProfiles
                .Where(u => (u.Role == "Staff" || u.Role == "staff") && (u.AccountStatus == "Active" || u.AccountStatus == "active"))
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();

            // 2. Nếu không có Staff, lấy danh sách Admin đang hoạt động làm fallback
            if (staffMembers.Count == 0)
            {
                staffMembers = await dbContext.UserProfiles
                    .Where(u => (u.Role == "Admin" || u.Role == "admin") && (u.AccountStatus == "Active" || u.AccountStatus == "active"))
                    .OrderBy(u => u.CreatedAt)
                    .ToListAsync();
            }

            // 3. Phân phối theo thuật toán Round-Robin dựa trên tổng số ticket hỗ trợ đã có
            string? assignedStaffEmail = null;
            UserProfile? assignedStaffProfile = null;

            if (staffMembers.Count > 0)
            {
                var totalTicketsCount = await dbContext.SupportRequests.CountAsync();
                assignedStaffProfile = staffMembers[totalTicketsCount % staffMembers.Count];
                assignedStaffEmail = assignedStaffProfile.Email;
            }

            if (string.IsNullOrWhiteSpace(assignedStaffEmail))
            {
                // Fallback 1: Tìm bất kỳ tài khoản Admin/Staff nào có trong hệ thống
                var firstAdmin = await dbContext.UserProfiles
                    .FirstOrDefaultAsync(u => u.Role == "Admin" || u.Role == "admin" || u.Role == "Staff" || u.Role == "staff");
                if (firstAdmin is not null)
                {
                    assignedStaffEmail = firstAdmin.Email;
                }
                else
                {
                    // Fallback 2: Gán email mặc định nếu cơ sở dữ liệu trống trơn
                    assignedStaffEmail = "staff_auto@miniseries.com";
                }
            }

            var item = new SupportRequest
            {
                Id = Guid.NewGuid(),
                CustomerEmail = customerEmail.Trim(),
                Content = req.Content.Trim(),
                Reply = "",
                Status = "Chờ trả lời",
                AssignedStaffEmail = assignedStaffEmail,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.SupportRequests.Add(item);
            await dbContext.SaveChangesAsync();

            // 4. Gửi email thông báo cho Staff được phân phối
            if (!string.IsNullOrWhiteSpace(assignedStaffEmail) && !string.IsNullOrWhiteSpace(_emailSettings.SenderEmail))
            {
                var staffName = assignedStaffProfile?.FullName ?? "Staff Member";
                var ticketId = item.Id;
                var ticketContent = item.Content;
                var customerMailVal = item.CustomerEmail;

                _ = Task.Run(async () =>
                {
                    try
                    {
                        var emailSubject = $"[MiniSeries Support] Phân phối yêu cầu mới #{ticketId}";
                        var emailHtmlBody = Helpers.EmailTemplateHelper.BuildStaffTicketNotification(
                            staffName,
                            ticketId.ToString(),
                            customerMailVal,
                            ticketContent
                        );

                        if (!string.IsNullOrWhiteSpace(_emailSettings.ApiKey))
                        {
                            using (var client = new System.Net.Http.HttpClient())
                            {
                                client.DefaultRequestHeaders.Add("api-key", _emailSettings.ApiKey);
                                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                                
                                var payload = new
                                {
                                    sender = new { name = _emailSettings.SenderName ?? "Mini Series Learning", email = _emailSettings.SenderEmail },
                                    to = new[] { new { email = assignedStaffEmail } },
                                    subject = emailSubject,
                                    htmlContent = emailHtmlBody
                                };
                                
                                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                                var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                                
                                var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);
                                if (!response.IsSuccessStatusCode)
                                {
                                    var errorResponse = await response.Content.ReadAsStringAsync();
                                    Console.WriteLine($"[Brevo HTTP API Error] Failed to send staff support notification email to {assignedStaffEmail}: {response.StatusCode} - {errorResponse}");
                                }
                            }
                        }
                        else if (!string.IsNullOrWhiteSpace(_emailSettings.AppPassword))
                        {
                            using (var smtpClient = new SmtpClient(_emailSettings.SmtpServer ?? "smtp.gmail.com"))
                            {
                                smtpClient.Port = int.TryParse(_emailSettings.Port, out var port) ? port : 587;
                                smtpClient.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.AppPassword);
                                smtpClient.EnableSsl = true;

                                var mailMessage = new MailMessage
                                {
                                    From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName ?? "Mini Series Learning"),
                                    Subject = emailSubject,
                                    Body = emailHtmlBody,
                                    IsBodyHtml = true
                                };
                                mailMessage.To.Add(assignedStaffEmail);

                                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                                await smtpClient.SendMailAsync(mailMessage, cts.Token);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email Background Error] Failed to send staff support notification email to {assignedStaffEmail}: {ex.Message}");
                    }
                });
            }

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
                .AsNoTracking()
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

            if (!string.IsNullOrWhiteSpace(_emailSettings.SenderEmail))
            {
                // Capture variables needed for the background thread
                var customerEmail = item.CustomerEmail;
                var ticketId = item.Id;
                var ticketContent = item.Content;
                var ticketReply = item.Reply;
                
                // Lookup customer name synchronously before starting background task
                var userProfile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Email == customerEmail);
                var customerName = userProfile?.FullName ?? customerEmail;
                
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var emailSubject = $"Phản hồi yêu cầu tư vấn - Phiếu #{ticketId}";
                        var emailHtmlBody = Helpers.EmailTemplateHelper.BuildSupportTicketReply(customerName, ticketContent, ticketReply, _emailSettings.SenderName ?? "Mini Series");

                        if (!string.IsNullOrWhiteSpace(_emailSettings.ApiKey))
                        {
                            using (var client = new System.Net.Http.HttpClient())
                            {
                                client.DefaultRequestHeaders.Add("api-key", _emailSettings.ApiKey);
                                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                                
                                var payload = new
                                {
                                    sender = new { name = _emailSettings.SenderName ?? "Mini Series Learning", email = _emailSettings.SenderEmail },
                                    to = new[] { new { email = customerEmail } },
                                    subject = emailSubject,
                                    htmlContent = emailHtmlBody
                                };
                                
                                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                                var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                                
                                var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);
                                if (!response.IsSuccessStatusCode)
                                {
                                    var errorResponse = await response.Content.ReadAsStringAsync();
                                    Console.WriteLine($"[Brevo HTTP API Error] Failed to send support reply email to {customerEmail}: {response.StatusCode} - {errorResponse}");
                                }
                            }
                        }
                        else if (!string.IsNullOrWhiteSpace(_emailSettings.AppPassword))
                        {
                            using (var smtpClient = new SmtpClient(_emailSettings.SmtpServer ?? "smtp.gmail.com"))
                            {
                                smtpClient.Port = int.TryParse(_emailSettings.Port, out var port) ? port : 587;
                                smtpClient.Credentials = new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.AppPassword);
                                smtpClient.EnableSsl = true;

                                var mailMessage = new MailMessage
                                {
                                    From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName ?? "Mini Series Learning"),
                                    Subject = emailSubject,
                                    Body = emailHtmlBody,
                                    IsBodyHtml = true
                                };
                                mailMessage.To.Add(customerEmail);

                                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                                await smtpClient.SendMailAsync(mailMessage, cts.Token);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email Background Error] Failed to send support reply email to {customerEmail}: {ex.Message}");
                    }
                });
            }

            return Ok(item);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
