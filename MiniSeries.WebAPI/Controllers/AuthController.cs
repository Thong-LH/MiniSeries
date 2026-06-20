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
    IConfiguration config,
    MiniSeriesDbContext dbContext,
    UserPlanQuotaService quotaService,
    ILogger<AuthController> logger) : ControllerBase
{
    private static readonly ConcurrentDictionary<string, string> TempOtpStore = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, PendingRegistration> PendingRegistrations = new(StringComparer.OrdinalIgnoreCase);

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

        if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(appPassword))
        {
            return BadRequest(new { message = "Chua cau hinh EmailSettings (SenderEmail / AppPassword)." });
        }

        try
        {
            using var smtpClient = new SmtpClient(emailSettings["SmtpServer"] ?? "smtp.gmail.com")
            {
                Port = int.TryParse(emailSettings["Port"], out var port) ? port : 587,
                Credentials = new NetworkCredential(senderEmail, appPassword),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, emailSettings["SenderName"] ?? "Mini Series Learning"),
                Subject = $"[{otpCode}] Ma xac thuc tai khoan moi",
                Body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #8b5cf6; text-align: center;'>Kich Hoat Tai Khoan</h2>
                    <p>Chao <b>{fullName}</b>,</p>
                    <p>Ma OTP de hoan tat dang ky tai khoan cua ban la:</p>
                    <div style='background: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; color: #333; letter-spacing: 2px;'>
                        {otpCode}
                    </div>
                    <p style='font-size: 12px; color: #777;'>Ma nay ap dung cho Email: {email}.</p>
                </div>",
                IsBodyHtml = true
            };
            mailMessage.To.Add(email);

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            await smtpClient.SendMailAsync(mailMessage, cts.Token);
            return Ok(new { message = "Ma OTP da duoc gui den Email." });
        }
        catch (OperationCanceledException)
        {
            TempOtpStore.TryRemove(email, out _);
            PendingRegistrations.TryRemove(email, out _);
            logger.LogError("Gửi mail OTP cho {Email} thất bại: Quá thời gian chờ (Timeout 10s). Có thể cổng SMTP 587 bị chặn.", email);
            return BadRequest(new { message = "Lỗi gửi Email xác thực: Quá thời gian chờ (10 giây). Có thể do nhà cung cấp host chặn cổng SMTP 587 hoặc cấu hình sai. Vui lòng kiểm tra log server để lấy mã OTP nếu cần." });
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

            return Ok(new
            {
                message = "Xac thuc Email thanh cong.",
                userId = profile.Id.ToString(),
                email = profile.Email,
                fullName = profile.FullName,
                role = AuthUser.NormalizeRole(profile.Role)
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
}

