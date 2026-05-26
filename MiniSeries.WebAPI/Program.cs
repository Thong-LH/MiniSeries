using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Lessons.Commands.ApproveLessonScript;
using MiniSeries.Application.Lessons.Commands.CreateLessonDraft;
using MiniSeries.Application.Lessons.Commands.GenerateLesson;
using MiniSeries.Application.Lessons.Commands.ReviewLessonScript;
using MiniSeries.Domain.Enums;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Options;
using MiniSeries.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Mvc;
using MiniSeries.Domain.Entities;

var builder = WebApplication.CreateBuilder(args);

// CẤU HÌNH SERVICES
builder.Services.AddHttpClient<GroqService>();
builder.Services.AddHttpClient<PollinationsService>();
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection(CloudinaryOptions.SectionName));

builder.Services.AddScoped<ILLMService, GroqService>();
builder.Services.AddScoped<IImageGenerationService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<IMangaService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<IVideoService>(sp => sp.GetRequiredService<PollinationsService>());
builder.Services.AddScoped<PollinationsService>();

var databaseConnectionString = builder.Configuration.GetConnectionString("MiniSeries");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    builder.Services.AddSingleton<ILessonStore, InMemoryLessonStore>();
}
else
{
    builder.Services.AddDbContext<MiniSeriesDbContext>(options =>
        options.UseNpgsql(databaseConnectionString));
    builder.Services.AddScoped<ILessonStore, EfLessonStore>();
}

var cloudinary = builder.Configuration.GetSection(CloudinaryOptions.SectionName).Get<CloudinaryOptions>();
if (cloudinary is not null &&
    !string.IsNullOrWhiteSpace(cloudinary.CloudName) &&
    !string.IsNullOrWhiteSpace(cloudinary.ApiKey) &&
    !string.IsNullOrWhiteSpace(cloudinary.ApiSecret))
{
    builder.Services.AddScoped<IStorageService, CloudinaryStorageService>();
}
else
{
    builder.Services.AddScoped<IStorageService>(sp => sp.GetRequiredService<PollinationsService>());
}

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(GenerateLessonCommand).Assembly));

// CẤU HÌNH CORS CHO PHÉP FRONT-END VÀ LIVE SERVER KẾT NỐI AN TOÀN
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

// ==================== CÁC ENDPOINT ĐÃ CÓ SẴN ====================

app.MapPost("/api/lessons/generate", async (GenerateLessonCommand command, IMediator mediator) =>
{
    var result = await mediator.Send(command);
    return Results.Ok(result);
})
.WithName("GenerateLesson");

app.MapPost("/api/lessons/drafts", async (CreateLessonDraftRequest request, IMediator mediator) =>
{
    var result = await mediator.Send(new CreateLessonDraftCommand(
        request.RawContent,
        request.Title,
        request.GenerateVideo,
        request.CreativeMode,
        request.CreativeBrief));
    return Results.Ok(result);
})
.WithName("CreateLessonDraft");

app.MapPost("/api/lessons/{lessonId:guid}/review", async (
    Guid lessonId,
    ReviewLessonScriptRequest request,
    IMediator mediator) =>
{
    var result = await mediator.Send(new ReviewLessonScriptCommand(lessonId, request.Feedback));
    return Results.Ok(result);
})
.WithName("ReviewLessonScript");

app.MapPost("/api/lessons/{lessonId:guid}/approve", async (
    Guid lessonId,
    IMediator mediator) =>
{
    var result = await mediator.Send(new ApproveLessonScriptCommand(lessonId));
    return Results.Ok(result);
})
.WithName("ApproveLessonScript");

app.MapGet("/api/lessons/{lessonId:guid}", async (
    Guid lessonId,
    ILessonStore lessonStore) =>
{
    var lesson = await lessonStore.GetByIdAsync(lessonId);
    return lesson is null ? Results.NotFound() : Results.Ok(lesson);
})
.WithName("GetLesson");


// ==================== CÁC ENDPOINT AUTH (ĐÃ ĐƯỢC SỬA ĐÀNG HOÀNG) ====================

var tempOtpStore = new System.Collections.Concurrent.ConcurrentDictionary<string, string>();

app.MapPost("/api/auth/register-profile", async (RegisterProfileDto dto, MiniSeriesDbContext db, IConfiguration config) =>
{
    var existingProfile = await db.UserProfiles.FirstOrDefaultAsync(p => p.Email == dto.Email);
    if (existingProfile != null)
    {
        return Results.BadRequest(new { message = "Email này đã được đăng ký trên hệ thống." });
    }

    var random = new Random();
    var otpCode = random.Next(100000, 999999).ToString();
    tempOtpStore[dto.Email] = otpCode;

    var emailSettings = config.GetSection("EmailSettings");
    var senderEmail = emailSettings["SenderEmail"];
    var appPassword = emailSettings["AppPassword"];

    try
    {
        using var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(senderEmail, appPassword),
            EnableSsl = true,
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(senderEmail!, "Mini Series Learning"),
            Subject = $"[{otpCode}] Mã xác thực tài khoản mới",
            Body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #8b5cf6; text-align: center;'>Kích Hoạt Tài Khoản</h2>
                    <p>Chào <b>{dto.FullName}</b>,</p>
                    <p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>
                    <div style='background: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; color: #333; letter-spacing: 2px;'>
                        {otpCode}
                    </div>
                    <p style='font-size: 12px; color: #777;'>Mã này áp dụng cho Email: {dto.Email}.</p>
                </div>",
            IsBodyHtml = true
        };
        
        mailMessage.To.Add(dto.Email); 

        await smtpClient.SendMailAsync(mailMessage);
        return Results.Ok(new { message = "Mã OTP đã được gửi thẳng đến Email!" });
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine("\n======================= [LỖI GỬI EMAIL CHI TIẾT] =======================");
        Console.WriteLine(ex.ToString());
        Console.WriteLine("========================================================================\n");
        Console.ResetColor();

        return Results.BadRequest(new { message = "Lỗi hệ thống không gửi được Email: " + ex.Message });
    }
});

app.MapPost("/api/auth/verify-otp", async (VerifyOtpDto dto, MiniSeriesDbContext db) =>
{
    if (!tempOtpStore.TryGetValue(dto.Email, out var savedOtp) || savedOtp != dto.OtpCode)
    {
        return Results.BadRequest(new { message = "Mã xác nhận không chính xác hoặc đã hết hạn!" });
    }

    // Chuyển đổi chuỗi String Id từ Front-end gửi sang kiểu Guid an toàn trong DB
    if (!Guid.TryParse(dto.SupabaseUserId, out Guid parsedGuid))
    {
        parsedGuid = Guid.NewGuid(); // Tự sinh mã mới nếu ID truyền lên lỗi định dạng
    }

    var profile = new MiniSeries.Domain.Entities.UserProfile
    {
        Id = parsedGuid,
        Email = dto.Email,
        FullName = dto.FullName,
        Role = "Customer"
    };

    db.UserProfiles.Add(profile);
    await db.SaveChangesAsync();

    tempOtpStore.TryRemove(dto.Email, out _);
    return Results.Ok(new { message = "Xác thực Email thành công! Hồ sơ đã được khởi tạo." });
});

app.MapGet("/api/auth/profile/{userId}", async (Guid userId, MiniSeriesDbContext db) =>
{
    var profile = await db.UserProfiles.FindAsync(userId);
    if (profile == null)
    {
        return Results.NotFound(new { message = "Không tìm thấy thông tin phân quyền." });
    }

    return Results.Ok(profile);
});

app.MapPost("/api/auth/login-profile", async (LoginRequestDto dto, MiniSeriesDbContext db) =>
{
    var profile = await db.UserProfiles.FirstOrDefaultAsync(p => p.Email == dto.Email);
        
    if (profile == null)
    {
        return Results.NotFound(new { message = "Tài khoản không tồn tại trên hệ thống hoặc mật khẩu sai!" });
    }

    // Trả về Object JSON chuẩn đét có đầy đủ ID để Front-end lưu localStorage
    return Results.Ok(new { 
        userId = profile.Id.ToString(), 
        email = profile.Email, 
        fullName = profile.FullName, 
        role = profile.Role 
    });
});

app.MapGet("/api/profile/{id:guid}", async (Guid id, MiniSeriesDbContext db) =>
{
    var profile = await db.UserProfiles.FindAsync(id);
    if (profile == null)
    {
        return Results.NotFound(new { message = "Không tìm thấy hồ sơ người dùng." });
    }

    return Results.Ok(new {
        id = profile.Id,
        email = profile.Email,
        fullName = profile.FullName,
        role = profile.Role,
        avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={profile.FullName}", 
        tokens = 100, 
        tier = "Free" 
    });
});

app.MapPut("/api/profile/{id:guid}", async (Guid id, UpdateProfileDto dto, MiniSeriesDbContext db) =>
{
    var profile = await db.UserProfiles.FindAsync(id);
    if (profile == null)
    {
        return Results.NotFound(new { message = "Không tìm thấy hồ sơ người dùng." });
    }

    profile.FullName = dto.FullName;

    await db.SaveChangesAsync();
    return Results.Ok(new { message = "Cập nhật hồ sơ thành công!", data = profile });
});


// ==========================================
// CÁC ENDPOINT CỔNG THANH TOÁN (ĐÃ ĐỒNG BỘ SEPAY)
// ==========================================

// 1. API KHỞI TẠO HÓA ĐƠN
app.MapPost("/api/payment/create-invoice", async ([FromBody] InvoiceRequest req, MiniSeriesDbContext context) =>
{
    if (req == null || string.IsNullOrWhiteSpace(req.UserId))
    {
        return Results.BadRequest(new { message = "Mã người dùng không được để trống." });
    }

    string cleanId = req.UserId.Replace("-", "").Trim();

    if (cleanId.Length < 4)
    {
        return Results.BadRequest(new { message = "Mã người dùng quá ngắn hoặc không hợp lệ." });
    }

    string lastFourDigits = cleanId.Substring(cleanId.Length - 4).ToUpper();
    string safeCode = $"MGX{lastFourDigits}";

    try
    {
        var oldOrders = context.PaymentOrders.Where(o => o.UserId == req.UserId && !o.IsCompleted);
        context.PaymentOrders.RemoveRange(oldOrders);

        var order = new PaymentOrder
        {
            UserId = req.UserId,
            PaymentCode = safeCode,
            TokensAmount = req.Tokens,
            MoneyAmount = req.Amount,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        context.PaymentOrders.Add(order);
        await context.SaveChangesAsync();

        return Results.Ok(new { paymentCode = safeCode });
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"[LỖI LƯU HÓA ĐƠN]: {ex.Message}");
        Console.ResetColor();
        
        return Results.StatusCode(500);
    }
});

// 2. API WEBHOOK SEPAY
app.MapPost("/api/payment/bank-webhook", async ([FromBody] BankWebhookModel bankData, MiniSeriesDbContext context) =>
{
    // Đọc trường Content từ SePay gửi về
    string content = bankData.Content?.ToUpper() ?? "";

    var order = await context.PaymentOrders
        .FirstOrDefaultAsync(o => !o.IsCompleted && content.Contains(o.PaymentCode));

    if (order != null)
    {
        order.IsCompleted = true;
        order.PaidAt = DateTime.UtcNow;

        var profile = await context.UserProfiles.FirstOrDefaultAsync(p => p.Id.ToString() == order.UserId);
        if (profile != null)
        {
            // Tăng tài nguyên thực tế tại đây khi nạp tiền thành công
            // profile.Tokens += order.TokensAmount;
        }

        await context.SaveChangesAsync();
        return Results.Ok(new { success = true, message = "Đã nhận tiền ngân hàng SePay thành công!" });
    }

    return Results.BadRequest("Nội dung chuyển khoản không trùng khớp hóa đơn nào.");
});

// 3. API KIỂM TRA TRẠNG THÁI REAL-TIME CHO FRONTEND POLLING
app.MapGet("/api/payment/check-status", async ([FromQuery] string userId, [FromQuery] string code, MiniSeriesDbContext context) =>
{
    var order = await context.PaymentOrders
        .FirstOrDefaultAsync(o => o.UserId == userId && o.PaymentCode == code);

    if (order != null && order.IsCompleted)
    {
        return Results.Ok(new { isPaid = true });
    }
    return Results.Ok(new { isPaid = false });
});

app.Run();


// ==================== ĐỊNH NGHĨA DTO / RECORD ĐÃ ĐƯỢC CHUẨN HÓA ĐỒNG BỘ ====================

// SupabaseUserId đổi thành String để nhận dữ liệu chuỗi an toàn từ Front-end gửi lên
public record RegisterProfileDto(string SupabaseUserId, string Email, string FullName, string Password);
public record VerifyOtpDto(string SupabaseUserId, string Email, string FullName, string OtpCode);

// LoginRequestDto đồng bộ nhận cả Email và Mật khẩu đúng quy cách chuyên nghiệp
public record LoginRequestDto(string Email, string Password);

public sealed record CreateLessonDraftRequest(
    string RawContent,
    string Title,
    bool GenerateVideo,
    CreativeMode CreativeMode,
    string? CreativeBrief);

public sealed record ReviewLessonScriptRequest(string Feedback);
public record UpdateProfileDto(string FullName, string? PhoneNumber, string? AvatarUrl);

public class InvoiceRequest
{
    public string UserId { get; set; } = string.Empty;
    public int Tokens { get; set; }
    public decimal Amount { get; set; }
}

// Cấu trúc BankWebhookModel chuẩn khớp hoàn toàn cấu trúc SePay
public class BankWebhookModel
{
    public string Content { get; set; } = string.Empty;
    public decimal TransferAmount { get; set; }
}