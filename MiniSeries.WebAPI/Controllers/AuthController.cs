using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.Infrastructure.Services;
using MiniSeries.WebAPI.Contracts;
using MiniSeries.WebAPI.Security;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Mail;
using System.Threading;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    SupabaseAuthService auth,
    SupabaseAdminAuthService adminAuth,
    IConfiguration config,
    MiniSeriesDbContext dbContext,
    UserPlanQuotaService quotaService,
    ILogger<AuthController> logger) : ControllerBase
{
    private static readonly ConcurrentDictionary<string, string> TempOtpStore = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, PendingRegistration> PendingRegistrations = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, string> ForgotPasswordOtpStore = new(StringComparer.OrdinalIgnoreCase);

    [HttpPost("register-profile")]
    public async Task<IActionResult> RegisterProfile([FromBody] RegisterProfileRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var password = dto.Password ?? "";
        var fullName = (dto.FullName ?? "").Trim();
        const string role = "Customer";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(fullName))
        {
            return BadRequest(new { message = "Vui long nhap day du email, fullName va password." });
        }
        if (password.Length < 6)
        {
            return BadRequest(new { message = "Mat khau toi thieu 6 ky tu." });
        }

        try
        {
            var existing = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Email == email);
            if (existing is not null)
            {
                return BadRequest(new { message = "Email nay da duoc dang ky tren he thong." });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Khong kiem tra duoc ho so: " + ex.Message });
        }

        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        TempOtpStore[email] = otpCode;
        PendingRegistrations[email] = new PendingRegistration
        {
            Email = email,
            Password = password,
            FullName = fullName,
            Role = role,
            SupabaseUserId = dto.SupabaseUserId
        };

        logger.LogInformation("Yêu cầu gửi OTP cho Email: {Email}. Mã OTP tạo ra: {OtpCode}", email, otpCode);

        var emailSettings = config.GetSection("EmailSettings");
        var senderEmail = emailSettings["SenderEmail"];
        var appPassword = emailSettings["AppPassword"];
        var apiKey = emailSettings["ApiKey"];

        if (string.IsNullOrWhiteSpace(senderEmail))
        {
            return BadRequest(new { message = "Chua cau hinh EmailSettings (SenderEmail)." });
        }

        var emailSubject = $"[{otpCode}] Ma xac thuc tai khoan moi";
        var emailHtmlBody = $@"
        <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
            <h2 style='color: #8b5cf6; text-align: center;'>Kich Hoat Tai Khoan</h2>
            <p>Chao <b>{fullName}</b>,</p>
            <p>Ma OTP de hoan tat dang ky tai khoan cua ban la:</p>
            <div style='background: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; color: #333; letter-spacing: 2px;'>
                {otpCode}
            </div>
            <p style='font-size: 12px; color: #777;'>Ma nay ap dung cho Email: {email}.</p>
        </div>";

        try
        {
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    client.DefaultRequestHeaders.Add("api-key", apiKey);
                    client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                    
                    var payload = new
                    {
                        sender = new { name = emailSettings["SenderName"] ?? "Mini Series Learning", email = senderEmail },
                        to = new[] { new { email = email } },
                        subject = emailSubject,
                        htmlContent = emailHtmlBody
                    };
                    
                    var json = System.Text.Json.JsonSerializer.Serialize(payload);
                    var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                    
                    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                    var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content, cts.Token);
                    if (!response.IsSuccessStatusCode)
                    {
                        var errorResponse = await response.Content.ReadAsStringAsync();
                        throw new Exception($"Brevo API Error: {response.StatusCode} - {errorResponse}");
                    }
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(appPassword))
                {
                    return BadRequest(new { message = "Chua cau hinh EmailSettings AppPassword cho SMTP." });
                }

                using var smtpClient = new SmtpClient(emailSettings["SmtpServer"] ?? "smtp.gmail.com")
                {
                    Port = int.TryParse(emailSettings["Port"], out var port) ? port : 587,
                    Credentials = new NetworkCredential(senderEmail, appPassword),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, emailSettings["SenderName"] ?? "Mini Series Learning"),
                    Subject = emailSubject,
                    Body = emailHtmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                await smtpClient.SendMailAsync(mailMessage, cts.Token);
            }

            return Ok(new { message = "Ma OTP da duoc gui den Email." });
        }
        catch (OperationCanceledException)
        {
            TempOtpStore.TryRemove(email, out _);
            PendingRegistrations.TryRemove(email, out _);
            logger.LogError("Gửi mail OTP cho {Email} thất bại: Quá thời gian chờ (Timeout 15s).", email);
            return BadRequest(new { message = "Lỗi gửi Email xác thực: Quá thời gian chờ (15 giây). Vui lòng thử lại." });
        }
        catch (Exception ex)
        {
            TempOtpStore.TryRemove(email, out _);
            PendingRegistrations.TryRemove(email, out _);
            logger.LogError(ex, "Lỗi gửi mail OTP cho {Email}", email);
            return BadRequest(new { message = "Loi he thong khong gui duoc Email: " + ex.Message });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var otpCode = (dto.OtpCode ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otpCode))
        {
            return BadRequest(new { message = "Thieu email hoac ma OTP." });
        }
        if (!TempOtpStore.TryGetValue(email, out var savedOtp) || savedOtp != otpCode)
        {
            return BadRequest(new { message = "Ma xac nhan khong chinh xac hoac da het han." });
        }
        if (!PendingRegistrations.TryGetValue(email, out var pending))
        {
            return BadRequest(new { message = "Phien dang ky da het han. Vui long dang ky lai." });
        }

        var fullName = string.IsNullOrWhiteSpace(dto.FullName) ? pending.FullName : dto.FullName.Trim();

        try
        {
            var session = await auth.SignUpAsync(email, pending.Password, fullName);
            var profile = new UserProfile
            {
                Id = session.UserId,
                Email = email,
                FullName = fullName,
                Role = pending.Role,
                PlanName = "Free",
                MangaMonthlyLimit = 3,
                UsedMangaCount = 0,
                VideoMonthlyLimit = 1,
                UsedVideoCount = 0,
                AccountStatus = "Active",
                TokenBalance = 0,
                CurrentPeriodStart = DateTime.UtcNow,
                CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                CreatedAt = DateTime.UtcNow
            };

            dbContext.UserProfiles.Add(profile);
            await dbContext.SaveChangesAsync();

            TempOtpStore.TryRemove(email, out _);
            PendingRegistrations.TryRemove(email, out _);

            var quota = await quotaService.GetSnapshotAsync(profile);

            return Ok(new
            {
                message = "Xac thuc Email thanh cong.",
                userId = profile.Id.ToString(),
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role),
                accessToken = session.AccessToken,

                // Quota properties returned directly at registration verification
                planName = quota.PlanName,
                remainingMangaCount = quota.RemainingMangaCount,
                mangaMonthlyLimit = quota.MangaMonthlyLimit,
                remainingVideoCount = quota.RemainingVideoCount,
                videoMonthlyLimit = quota.VideoMonthlyLimit,
                currentPeriodEnd = quota.CurrentPeriodEnd,
                avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName ?? "User")}"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Policy = "AuthenticatedUser")]
    [HttpGet("profile/{userId:guid}")]
    public async Task<IActionResult> GetAuthProfile(Guid userId)
    {
        var currentUserId = AuthUser.GetCurrentUserId(User);
        if (currentUserId is null)
        {
            return Unauthorized();
        }
        if (currentUserId.Value != userId && !User.IsInRole("Staff") && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == userId);
            return profile is null
                ? NotFound(new { message = "Khong tim thay thong tin phan quyen." })
                : Ok(profile);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login-profile")]
    public async Task<IActionResult> LoginProfile([FromBody] LoginProfileRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var password = dto.Password ?? "";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { message = "Vui long nhap Email va Password." });
        }

        try
        {
            var sw = Stopwatch.StartNew();
            var session = await auth.SignInAsync(email, password);
            logger.LogInformation("LoginProfile timing: Supabase sign-in completed in {ElapsedMs}ms for {Email}.",
                sw.ElapsedMilliseconds,
                email);

            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == session.UserId);
            logger.LogInformation("LoginProfile timing: UserProfiles lookup completed in {ElapsedMs}ms for {Email}.",
                sw.ElapsedMilliseconds,
                email);

            if (profile is not null && string.Equals(profile.AccountStatus, "Blocked", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Tai khoan da bi khoa. Vui long lien he Admin." });
            }

            if (profile is null)
            {
                profile = new UserProfile
                {
                    Id = session.UserId,
                    Email = string.IsNullOrEmpty(session.Email) ? email : session.Email,
                    FullName = "User",
                    Role = "Customer",
                    PlanName = "Free",
                    MangaMonthlyLimit = 3,
                    UsedMangaCount = 0,
                    VideoMonthlyLimit = 1,
                    UsedVideoCount = 0,
                    CurrentPeriodStart = DateTime.UtcNow,
                    CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.UserProfiles.Add(profile);
                await dbContext.SaveChangesAsync();
                logger.LogInformation("LoginProfile timing: missing UserProfile created in {ElapsedMs}ms for {Email}.",
                    sw.ElapsedMilliseconds,
                    email);
            }

            var quota = await quotaService.GetSnapshotAsync(profile);
            logger.LogInformation("LoginProfile timing: quota snapshot completed in {ElapsedMs}ms for {Email}.",
                sw.ElapsedMilliseconds,
                email);

            return Ok(new
            {
                userId = profile.Id.ToString(),
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role),
                accessToken = session.AccessToken,
                
                // Quota properties returned directly at login
                planName = quota.PlanName,
                remainingMangaCount = quota.RemainingMangaCount,
                mangaMonthlyLimit = quota.MangaMonthlyLimit,
                remainingVideoCount = quota.RemainingVideoCount,
                videoMonthlyLimit = quota.VideoMonthlyLimit,
                currentPeriodEnd = quota.CurrentPeriodEnd,
                avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName ?? "User")}"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status401Unauthorized, new { message = ex.Message });
        }
    }

    [HttpPost("google-signin")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequest dto)
    {
        var token = (dto.AccessToken ?? "").Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { message = "Thiếu Access Token từ Google." });
        }

        try
        {
            // 1. Xác thực access token với Supabase và lấy thông tin user
            var userSession = await auth.GetUserByTokenAsync(token);
            var email = userSession.Email.Trim().ToLowerInvariant();
            var userId = userSession.UserId;
            var fullName = userSession.FullName ?? email.Split('@')[0];

            logger.LogInformation("Xác thực thành công token Google cho email: {Email}, UserId: {UserId}", email, userId);

            // 2. Kiểm tra tài khoản đã bị khóa trong Database chưa
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == userId);
            if (profile is not null &&
                string.Equals(profile.AccountStatus, "Blocked", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new { message = "Tài khoản đã bị khóa. Vui lòng liên hệ Admin." });
            }

            // 3. Đảm bảo UserProfile tồn tại trong Database
            if (profile is null)
            {
                profile = new UserProfile
                {
                    Id = userId,
                    Email = email,
                    FullName = fullName,
                    Role = "Customer",
                    PlanName = "Free",
                    MangaMonthlyLimit = 3,
                    UsedMangaCount = 0,
                    VideoMonthlyLimit = 1,
                    UsedVideoCount = 0,
                    AccountStatus = "Active",
                    TokenBalance = 0,
                    CurrentPeriodStart = DateTime.UtcNow,
                    CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.UserProfiles.Add(profile);
                await dbContext.SaveChangesAsync();

                logger.LogInformation("Đã tạo UserProfile mới cho người dùng Google đăng nhập lần đầu: {Email}.", email);
            }

            // 4. Lấy thông tin quota và trả về kết quả đăng nhập giống hệt login-profile
            var quota = await quotaService.GetSnapshotAsync(profile);

            return Ok(new
            {
                userId = profile.Id.ToString(),
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role),
                accessToken = token, // Sử dụng luôn access token Google/Supabase

                // Quota properties
                planName = quota.PlanName,
                remainingMangaCount = quota.RemainingMangaCount,
                mangaMonthlyLimit = quota.MangaMonthlyLimit,
                remainingVideoCount = quota.RemainingVideoCount,
                videoMonthlyLimit = quota.VideoMonthlyLimit,
                currentPeriodEnd = quota.CurrentPeriodEnd,
                avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName ?? "User")}"
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi xử lý Google Sign-In");
            return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Xác thực token Google thất bại: " + ex.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Vui lòng nhập Email." });
        }

        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Email == email);
            if (profile is null)
            {
                return BadRequest(new { message = "Email này không tồn tại trong hệ thống." });
            }

            var otpCode = Random.Shared.Next(100000, 999999).ToString();
            ForgotPasswordOtpStore[email] = otpCode;

            logger.LogInformation("Yêu cầu lấy lại mật khẩu cho Email: {Email}. Mã OTP: {OtpCode}", email, otpCode);

            var emailSettings = config.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var appPassword = emailSettings["AppPassword"];
            var apiKey = emailSettings["ApiKey"];

            if (string.IsNullOrWhiteSpace(senderEmail))
            {
                return BadRequest(new { message = "Chưa cấu hình EmailSettings (SenderEmail)." });
            }

            var emailSubject = $"[{otpCode}] Ma xac thuc dat lai mat khau";
            var emailHtmlBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                <h2 style='color: #8b5cf6; text-align: center;'>Lay Lai Mat Khau</h2>
                <p>Chao ban,</p>
                <p>Ma OTP de dat lai mat khau tai khoan cua ban la:</p>
                <div style='background: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; color: #333; letter-spacing: 2px;'>
                    {otpCode}
                </div>
                <p style='font-size: 12px; color: #777;'>Ma nay ap dung cho Email: {email}.</p>
                <p style='font-size: 12px; color: #ff3333;'>Luu y: Vui long khong chia se ma nay voi bat ky ai.</p>
            </div>";

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                using var client = new System.Net.Http.HttpClient();
                client.DefaultRequestHeaders.Add("api-key", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                
                var payload = new
                {
                    sender = new { name = emailSettings["SenderName"] ?? "Mini Series Learning", email = senderEmail },
                    to = new[] { new { email = email } },
                    subject = emailSubject,
                    htmlContent = emailHtmlBody
                };
                
                var json = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new System.Net.Http.StringContent(json, System.Text.Encoding.UTF8, "application/json");
                
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content, cts.Token);
                if (!response.IsSuccessStatusCode)
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Brevo API Error: {response.StatusCode} - {errorResponse}");
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(appPassword))
                {
                    return BadRequest(new { message = "Chua cau hinh EmailSettings AppPassword cho SMTP." });
                }

                using var smtpClient = new SmtpClient(emailSettings["SmtpServer"] ?? "smtp.gmail.com")
                {
                    Port = int.TryParse(emailSettings["Port"], out var port) ? port : 587,
                    Credentials = new NetworkCredential(senderEmail, appPassword),
                    EnableSsl = true
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, emailSettings["SenderName"] ?? "Mini Series Learning"),
                    Subject = emailSubject,
                    Body = emailHtmlBody,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(email);

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                await smtpClient.SendMailAsync(mailMessage, cts.Token);
            }

            return Ok(new { message = "Mã OTP lấy lại mật khẩu đã được gửi đến Email." });
        }
        catch (Exception ex)
        {
            ForgotPasswordOtpStore.TryRemove(email, out _);
            logger.LogError(ex, "Lỗi gửi mail OTP lấy lại mật khẩu cho {Email}", email);
            return BadRequest(new { message = "Lỗi hệ thống không gửi được Email: " + ex.Message });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var otpCode = (dto.OtpCode ?? "").Trim();
        var newPassword = dto.NewPassword ?? "";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otpCode) || string.IsNullOrWhiteSpace(newPassword))
        {
            return BadRequest(new { message = "Vui lòng điền đầy đủ Email, mã OTP và Mật khẩu mới." });
        }

        if (newPassword.Length < 6)
        {
            return BadRequest(new { message = "Mật khẩu mới tối thiểu phải có 6 ký tự." });
        }

        if (!ForgotPasswordOtpStore.TryGetValue(email, out var savedOtp) || savedOtp != otpCode)
        {
            return BadRequest(new { message = "Mã xác nhận không chính xác hoặc đã hết hạn." });
        }

        try
        {
            var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(u => u.Email == email);
            if (profile is null)
            {
                return BadRequest(new { message = "Tài khoản không tồn tại trên hệ thống." });
            }

            // Gọi service admin auth để reset password trên Supabase Auth
            await adminAuth.UpdateUserPasswordAsync(profile.Id, newPassword);

            ForgotPasswordOtpStore.TryRemove(email, out _);
            logger.LogInformation("Thiết lập lại mật khẩu thành công cho tài khoản {Email}.", email);

            return Ok(new { message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi đặt lại mật khẩu cho {Email}", email);
            return BadRequest(new { message = "Lỗi khi cập nhật mật khẩu mới: " + ex.Message });
        }
    }

    [HttpPost("verify-reset-otp")]
    public IActionResult VerifyResetOtp([FromBody] VerifyOtpRequest dto)
    {
        var email = (dto.Email ?? "").Trim().ToLowerInvariant();
        var otpCode = (dto.OtpCode ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otpCode))
        {
            return BadRequest(new { message = "Vui lòng nhập đầy đủ email và mã OTP." });
        }

        if (!ForgotPasswordOtpStore.TryGetValue(email, out var savedOtp) || savedOtp != otpCode)
        {
            return BadRequest(new { message = "Mã xác thực không chính xác hoặc đã hết hạn." });
        }

        return Ok(new { message = "Mã xác thực chính xác." });
    }
}

