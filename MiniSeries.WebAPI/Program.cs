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
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// CẤU HÌNH SERVICES
builder.Services.AddHttpClient<GroqService>();
builder.Services.AddHttpClient<PollinationsService>();
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection(CloudinaryOptions.SectionName));
builder.Services.Configure<SupabaseOptions>(builder.Configuration.GetSection(SupabaseOptions.SectionName));
builder.Services.AddHttpClient<SupabaseRestService>();
builder.Services.AddHttpClient<SupabaseAuthService>();

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

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
});

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


// ==================== AUTH — OTP Gmail + Supabase Auth ====================

var tempOtpStore = new System.Collections.Concurrent.ConcurrentDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
var pendingRegistrations = new System.Collections.Concurrent.ConcurrentDictionary<string, PendingRegistration>(StringComparer.OrdinalIgnoreCase);

static System.Text.Json.JsonSerializerOptions CreateAuthJsonOptions() => new()
{
    PropertyNameCaseInsensitive = true
};

app.MapPost("/api/auth/register-profile", async (HttpContext http, SupabaseRestService supabaseDb, IConfiguration config) =>
{
    var dto = await http.Request.ReadFromJsonAsync<RegisterProfileRequest>(CreateAuthJsonOptions());
    if (dto is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ hoặc thiếu Content-Type application/json." });
    }

    var email = (dto.Email ?? "").Trim().ToLowerInvariant();
    var password = dto.Password ?? "";
    var fullName = (dto.FullName ?? "").Trim();
    var role = string.IsNullOrWhiteSpace(dto.Role) ? "Customer" : dto.Role!.Trim();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(fullName))
    {
        return Results.BadRequest(new { message = "Vui lòng nhập đầy đủ email, fullName và password." });
    }
    if (password.Length < 6)
    {
        return Results.BadRequest(new { message = "Mật khẩu tối thiểu 6 ký tự." });
    }

    try
    {
        var existing = await supabaseDb.GetUserProfileByEmailAsync(email);
        if (existing is not null)
        {
            return Results.BadRequest(new { message = "Email này đã được đăng ký trên hệ thống." });
        }
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = "Không kiểm tra được hồ sơ: " + ex.Message });
    }

    var otpCode = Random.Shared.Next(100000, 999999).ToString();
    tempOtpStore[email] = otpCode;
    pendingRegistrations[email] = new PendingRegistration
    {
        Email = email,
        Password = password,
        FullName = fullName,
        Role = role,
        SupabaseUserId = dto.SupabaseUserId
    };

    var emailSettings = config.GetSection("EmailSettings");
    var senderEmail = emailSettings["SenderEmail"];
    var appPassword = emailSettings["AppPassword"];

    if (string.IsNullOrWhiteSpace(senderEmail) || string.IsNullOrWhiteSpace(appPassword))
    {
        return Results.BadRequest(new { message = "Chưa cấu hình EmailSettings (SenderEmail / AppPassword)." });
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
            Subject = $"[{otpCode}] Mã xác thực tài khoản mới",
            Body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #8b5cf6; text-align: center;'>Kích Hoạt Tài Khoản</h2>
                    <p>Chào <b>{fullName}</b>,</p>
                    <p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>
                    <div style='background: #f3f4f6; padding: 15px; text-align: center; font-size: 26px; font-weight: bold; color: #333; letter-spacing: 2px;'>
                        {otpCode}
                    </div>
                    <p style='font-size: 12px; color: #777;'>Mã này áp dụng cho Email: {email}.</p>
                </div>",
            IsBodyHtml = true
        };
        mailMessage.To.Add(email);

        await smtpClient.SendMailAsync(mailMessage);
        return Results.Ok(new { message = "Mã OTP đã được gửi thẳng đến Email!" });
    }
    catch (Exception ex)
    {
        tempOtpStore.TryRemove(email, out _);
        pendingRegistrations.TryRemove(email, out _);
        return Results.BadRequest(new { message = "Lỗi hệ thống không gửi được Email: " + ex.Message });
    }
});

app.MapPost("/api/auth/verify-otp", async (HttpContext http, SupabaseAuthService auth, SupabaseRestService supabaseDb) =>
{
    var dto = await http.Request.ReadFromJsonAsync<VerifyOtpRequest>(CreateAuthJsonOptions());
    if (dto is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ hoặc thiếu Content-Type application/json." });
    }

    var email = (dto.Email ?? "").Trim().ToLowerInvariant();
    var otpCode = (dto.OtpCode ?? "").Trim();

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(otpCode))
    {
        return Results.BadRequest(new { message = "Thiếu email hoặc mã OTP." });
    }

    if (!tempOtpStore.TryGetValue(email, out var savedOtp) || savedOtp != otpCode)
    {
        return Results.BadRequest(new { message = "Mã xác nhận không chính xác hoặc đã hết hạn!" });
    }

    if (!pendingRegistrations.TryGetValue(email, out var pending))
    {
        return Results.BadRequest(new { message = "Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại để nhận mã OTP mới." });
    }

    var fullName = string.IsNullOrWhiteSpace(dto.FullName) ? pending.FullName : dto.FullName.Trim();
    var role = pending.Role;

    try
    {
        var session = await auth.SignUpAsync(email, pending.Password, fullName);
        var profile = await supabaseDb.CreateUserProfileAsync(session.UserId, email, fullName, role);
        if (profile is null)
        {
            return Results.Json(new { message = "Tạo Auth thành công nhưng không ghi được UserProfiles trên Supabase." }, statusCode: 500);
        }

        tempOtpStore.TryRemove(email, out _);
        pendingRegistrations.TryRemove(email, out _);

        return Results.Ok(new
        {
            message = "Xác thực Email thành công! Tài khoản đã được tạo trên Supabase.",
            userId = profile.Id.ToString(),
            email = profile.Email,
            fullName = profile.FullName,
            role = profile.Role
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/auth/profile/{userId:guid}", async (Guid userId, SupabaseRestService supabaseDb) =>
{
    try
    {
        var profile = await supabaseDb.GetUserProfileByIdAsync(userId);
        return profile is null
            ? Results.NotFound(new { message = "Không tìm thấy thông tin phân quyền." })
            : Results.Ok(profile);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/auth/login-profile", async (HttpContext http, SupabaseAuthService auth, SupabaseRestService supabaseDb) =>
{
    var dto = await http.Request.ReadFromJsonAsync<LoginProfileRequest>(CreateAuthJsonOptions());
    if (dto is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ hoặc thiếu Content-Type application/json." });
    }

    var email = (dto.Email ?? "").Trim().ToLowerInvariant();
    var password = dto.Password ?? "";

    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
    {
        return Results.BadRequest(new { message = "Vui lòng nhập Email và Password." });
    }

    try
    {
        var session = await auth.SignInAsync(email, password);
        var profile = await supabaseDb.GetUserProfileByIdAsync(session.UserId);
        if (profile is null)
        {
            profile = await supabaseDb.CreateUserProfileAsync(
                session.UserId,
                email,
                session.Email,
                "Customer");
        }

        if (profile is null)
        {
            return Results.Json(new { message = "Đăng nhập Auth thành công nhưng không tìm thấy UserProfiles." }, statusCode: 500);
        }

        return Results.Ok(new
        {
            userId = profile.Id.ToString(),
            email = profile.Email,
            fullName = profile.FullName,
            role = profile.Role,
            accessToken = session.AccessToken
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { message = ex.Message }, statusCode: StatusCodes.Status401Unauthorized);
    }
});

app.MapGet("/api/profile/{id:guid}", async (Guid id, SupabaseRestService supabaseDb) =>
{
    try
    {
        var profile = await supabaseDb.GetUserProfileByIdAsync(id);
        if (profile is null)
        {
            return Results.NotFound(new { message = "Không tìm thấy hồ sơ người dùng." });
        }

        return Results.Ok(new
        {
            id = profile.Id,
            email = profile.Email,
            fullName = profile.FullName,
            role = profile.Role,
            avatarUrl = $"https://api.dicebear.com/7.x/bottts/svg?seed={Uri.EscapeDataString(profile.FullName)}",
            tokens = 100,
            tier = "Free"
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});


// ==========================================
// THANH TOÁN — SePay + PaymentHistory (Supabase)
// ==========================================

var pendingPayments = new System.Collections.Concurrent.ConcurrentDictionary<string, PendingPaymentOrder>(StringComparer.OrdinalIgnoreCase);

app.MapPost("/api/payment/create-invoice", async (HttpContext http, SupabaseRestService supabaseDb) =>
{
    var req = await http.Request.ReadFromJsonAsync<CreateInvoiceRequest>(CreateAuthJsonOptions());
    if (req is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ hoặc thiếu Content-Type application/json." });
    }

    var userIdRaw = (req.UserId ?? "").Trim();
    var userEmailRaw = (req.UserEmail ?? "").Trim().ToLowerInvariant();

    Guid userGuid;
    string resolvedUserId;
    string userEmail;

    try
    {
        if (Guid.TryParse(userIdRaw, out userGuid))
        {
            resolvedUserId = userGuid.ToString();
            var profile = await supabaseDb.GetUserProfileByIdAsync(userGuid);
            userEmail = profile?.Email ?? userEmailRaw;
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                return Results.BadRequest(new { message = "Không tìm thấy email cho UserId này. Hãy gửi thêm userEmail trong body." });
            }
        }
        else if (!string.IsNullOrWhiteSpace(userEmailRaw))
        {
            var profile = await supabaseDb.GetUserProfileByEmailAsync(userEmailRaw);
            if (profile is null)
            {
                return Results.BadRequest(new { message = $"Không tìm thấy hồ sơ Customer với email: {userEmailRaw}" });
            }
            userGuid = profile.Id;
            resolvedUserId = profile.Id.ToString();
            userEmail = profile.Email;
        }
        else
        {
            return Results.BadRequest(new { message = "Cần userId (GUID) hợp lệ hoặc userEmail đã đăng ký." });
        }
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }

    if (req.Amount <= 0 || req.Tokens <= 0)
    {
        return Results.BadRequest(new { message = "amount và tokens phải lớn hơn 0." });
    }

    string cleanId = resolvedUserId.Replace("-", "", StringComparison.Ordinal);
    if (cleanId.Length < 4)
    {
        return Results.BadRequest(new { message = "Mã người dùng quá ngắn hoặc không hợp lệ." });
    }

    string safeCode = $"MGX{cleanId[^4..].ToUpperInvariant()}";

    foreach (var key in pendingPayments.Keys.ToList())
    {
        if (pendingPayments.TryGetValue(key, out var old) &&
            string.Equals(old.UserId, resolvedUserId, StringComparison.OrdinalIgnoreCase) &&
            !old.IsCompleted)
        {
            pendingPayments.TryRemove(key, out _);
        }
    }

    pendingPayments[safeCode] = new PendingPaymentOrder(
        resolvedUserId,
        userEmail,
        safeCode,
        req.Amount,
        req.Tokens,
        false,
        DateTime.UtcNow);

    return Results.Ok(new { paymentCode = safeCode, userId = resolvedUserId, userEmail });
});
app.MapGet("/api/payment/webhook-gateway", async () =>
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
                return Results.Content(jsonString, "application/json");
            }
            return Results.StatusCode((int)response.StatusCode);
        }
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});
// LẤY DANH SÁCH CUSTOMER CHO ADMIN/STAFF
app.MapGet("/api/admin/customers", async (SupabaseRestService supabaseDb) =>
{
    try
    {
        var customers = await supabaseDb.ListCustomersAsync();
        return Results.Ok(customers);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

// SỬA LỖI 1: THÊM API LẤY DANH SÁCH STAFF CHO TRANG QUẢN TRỊ ADMIN [ĐỒNG BỘ SUPABASE]
app.MapGet("/api/admin/staffs", async (SupabaseRestService supabaseDb) =>
{
    try
    {
        // Gọi hàm từ tầng SupabaseRestService, hoặc lọc trực tiếp các tài khoản có Role là Staff
        var staffs = await supabaseDb.ListStaffsAsync(); 
        return Results.Ok(staffs);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = "Không thể tải danh sách nhân viên: " + ex.Message });
    }
});

app.MapPost("/api/payment/bank-webhook", async ([FromBody] BankWebhookModel bankData, SupabaseRestService supabaseDb, ILogger<Program> logger) =>
{
    logger.LogInformation("/api/payment/bank-webhook invoked");
    logger.LogInformation("Incoming webhook content: {Content}", bankData?.Content);

    string content = bankData?.Content ?? "";
    string contentUpper = content.ToUpperInvariant();
    var amount = bankData?.TransferAmount > 0 ? bankData.TransferAmount : bankData?.Amount ?? 0m;

    var matched = pendingPayments.Values
        .FirstOrDefault(o => !o.IsCompleted && contentUpper.Contains(o.PaymentCode, StringComparison.OrdinalIgnoreCase));

    if (matched is null)
    {
        logger.LogWarning("No matching pending payment found for webhook content.");
        return Results.BadRequest(new { message = "Nội dung chuyển khoản không trùng khớp hóa đơn nào." });
    }

    logger.LogInformation("Matched paymentCode={Code} for user={UserId}", matched.PaymentCode, matched.UserId);

    try
    {
        var inserted = await supabaseDb.InsertPaymentHistoryAsync(
            matched.UserEmail,
            amount,
            matched.PaymentCode,
            content);

        logger.LogInformation("InsertPaymentHistoryAsync returned: {InsertedId}", inserted?.Id);

        if (pendingPayments.TryGetValue(matched.PaymentCode, out var order))
        {
            pendingPayments[matched.PaymentCode] = order with { IsCompleted = true };
        }

        return Results.Ok(new { success = true, message = "Đã lưu lịch sử thanh toán lên Supabase!", inserted = inserted });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to insert payment history for code {Code}", matched.PaymentCode);
        return Results.StatusCode(500, new { message = "Lỗi khi ghi lịch sử thanh toán.", error = ex.Message });
    }
});

// Debug endpoint: list current pendingPayments (temporary)
app.MapGet("/api/debug/pending-payments", () =>
{
    var list = pendingPayments.Values
        .Select(p => new { p.UserId, p.UserEmail, p.PaymentCode, p.Amount, p.IsCompleted, p.CreatedAt })
        .ToList();
    return Results.Ok(list);
});

// SỬA LỖI 2: CẬP NHẬT LẠI API CHECK-STATUS ĐỒNG BỘ TRỰC TIẾP QUA BẢNG PAYMENT_HISTORY CỦA SUPABASE
app.MapGet("/api/payment/check-status", async ([FromQuery] string userId, [FromQuery] string code, SupabaseRestService supabaseDb) =>
{
    if (string.IsNullOrWhiteSpace(code))
    {
        return Results.Ok(new { isPaid = false });
    }

    // 1. Kiểm tra nhanh trong bộ nhớ tạm pendingPayments trước
    if (pendingPayments.TryGetValue(code, out var order) && order.UserId == userId && order.IsCompleted)
    {
        return Results.Ok(new { isPaid = true });
    }

    // 2. Dự phòng: Nếu reset app làm mất bộ nhớ tạm, chọc thẳng lên bảng PaymentHistory trên Supabase để tìm kiếm
    try 
    {
        var historyList = await supabaseDb.ListPaymentHistoryAsync();
        var hasPaidOnCloud = historyList.Any(h => h.TransactionCode == code || (h.Content != null && h.Content.Contains(code, StringComparison.OrdinalIgnoreCase)));
        
        if (hasPaidOnCloud)
        {
            return Results.Ok(new { isPaid = true });
        }
    }
    catch 
    {
        // Bỏ qua lỗi kết nối cloud nếu có
    }

    return Results.Ok(new { isPaid = false });
});

app.MapGet("/api/admin/payment-history", async (SupabaseRestService supabaseDb) =>
{
    try
    {
        var list = await supabaseDb.ListPaymentHistoryAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/admin/payment-stats", async ([FromQuery] string? groupBy, SupabaseRestService supabaseDb) =>
{
    try
    {
        var stats = await supabaseDb.GetPaymentStatsAsync(groupBy ?? "month");
        return Results.Ok(stats);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

// Compatibility endpoints for legacy admin dashboard (dashboard.html)
app.MapGet("/api/admin/payments", async (SupabaseRestService supabaseDb) =>
{
    try
    {
        var list = await supabaseDb.ListPaymentHistoryAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/admin/revenue-stats", async (SupabaseRestService supabaseDb) =>
{
    try
    {
        var stats = await supabaseDb.GetPaymentStatsAsync("month");
        return Results.Ok(new { labels = stats.Labels, data = stats.Amounts });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

// ==========================================
// SUPPORT / FEEDBACK / REPORT - Supabase REST (Anon Key)
// ==========================================

app.MapPost("/api/support/create", async ([FromBody] SupportCreateRequest req, SupabaseRestService supabase) =>
{
    if (string.IsNullOrWhiteSpace(req.CustomerEmail) || string.IsNullOrWhiteSpace(req.Content))
    {
        return Results.BadRequest(new { message = "Thiếu email hoặc nội dung yêu cầu." });
    }

    try
    {
        var item = await supabase.CreateSupportAsync(req.CustomerEmail.Trim(), req.Content.Trim());
        return item is null
            ? Results.StatusCode(500)
            : Results.Ok(item);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/support/list", async (SupabaseRestService supabase) =>
{
    try
    {
        var list = await supabase.ListSupportAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/support/reply", async (HttpContext http, SupabaseRestService supabase) =>
{
    var req = await http.Request.ReadFromJsonAsync<SupportReplyRequest>();
    if (req is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ." });
    }

    var supportId = req.ResolveId();
    var replyText = req.ResolveReply();
    if (supportId is null)
    {
        return Results.BadRequest(new { message = "ID yêu cầu tư vấn không hợp lệ hoặc bị thiếu." });
    }
    if (string.IsNullOrWhiteSpace(replyText))
    {
        return Results.BadRequest(new { message = "Thiếu nội dung phản hồi." });
    }

    try
    {
        var item = await supabase.ReplySupportAsync(supportId.Value, replyText.Trim());
        return item is null
            ? Results.NotFound(new { message = "Không tìm thấy yêu cầu tư vấn." })
            : Results.Ok(item);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/feedback/create", async ([FromBody] FeedbackCreateRequest req, SupabaseRestService supabase) =>
{
    if (req.Rating is < 1 or > 5 || string.IsNullOrWhiteSpace(req.Comment))
    {
        return Results.BadRequest(new { message = "Đánh giá không hợp lệ." });
    }

    var email = string.IsNullOrWhiteSpace(req.Email) ? "khachhang@test.com" : req.Email.Trim();
    try
    {
        var item = await supabase.CreateFeedbackAsync(email, req.Rating, req.Comment.Trim());
        return item is null
            ? Results.StatusCode(500)
            : Results.Ok(item);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/feedback/public-list", async (SupabaseRestService supabase) =>
{
    try
    {
        var list = await supabase.ListFeedbacksAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/feedback/list", async (SupabaseRestService supabase) =>
{
    try
    {
        var list = await supabase.ListFeedbacksAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/report/create", async ([FromBody] ReportCreateRequest req, SupabaseRestService supabase) =>
{
    if (string.IsNullOrWhiteSpace(req.StaffName) || string.IsNullOrWhiteSpace(req.Content))
    {
        return Results.BadRequest(new { message = "Thiếu tên Staff hoặc nội dung báo cáo." });
    }

    try
    {
        var item = await supabase.CreateReportAsync(req.StaffName.Trim(), req.Content.Trim());
        return item is null
            ? Results.StatusCode(500)
            : Results.Ok(item);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapGet("/api/report/list", async (SupabaseRestService supabase) =>
{
    try
    {
        var list = await supabase.ListReportsAsync();
        return Results.Ok(list);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.MapPost("/api/report/reply", async (HttpContext http, SupabaseRestService supabase) =>
{
    var req = await http.Request.ReadFromJsonAsync<ReportReplyRequest>();
    if (req is null)
    {
        return Results.BadRequest(new { message = "Body JSON không hợp lệ." });
    }

    var reportId = req.ResolveId();
    var adminReply = req.ResolveAdminReply();
    if (reportId is null)
    {
        return Results.BadRequest(new { message = "ID báo cáo không hợp lệ hoặc bị thiếu." });
    }
    if (string.IsNullOrWhiteSpace(adminReply))
    {
        return Results.BadRequest(new { message = "Thiếu nội dung phản hồi." });
    }

    try
    {
        var item = await supabase.ReplyReportAsync(reportId.Value, adminReply.Trim());
        return item is null
            ? Results.NotFound(new { message = "Không tìm thấy báo cáo." })
            : Results.Ok(item);
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
});

app.Run();


// ==================== ĐỊNH NGHĨA DTO / RECORD ĐÃ ĐƯỢC CHUẨN HÓA ĐỒNG BỘ ====================

public sealed record CreateLessonDraftRequest(
    string RawContent,
    string Title,
    bool GenerateVideo,
    CreativeMode CreativeMode,
    string? CreativeBrief);

public sealed record ReviewLessonScriptRequest(string Feedback);
public record UpdateProfileDto(string FullName, string? PhoneNumber, string? AvatarUrl);

public sealed class CreateInvoiceRequest
{
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("userEmail")]
    public string? UserEmail { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("tokens")]
    public int Tokens { get; set; }

    [JsonPropertyName("planName")]
    public string? PlanName { get; set; }
}

public class BankWebhookModel
{
    public string Content { get; set; } = string.Empty;
    public decimal TransferAmount { get; set; }
    public decimal Amount { get; set; }
}

public sealed record PendingPaymentOrder(
    string UserId,
    string UserEmail,
    string PaymentCode,
    decimal MoneyAmount,
    int TokensAmount,
    bool IsCompleted,
    DateTime CreatedAt);

public sealed class RegisterProfileRequest
{
    [JsonPropertyName("supabaseUserId")]
    public string? SupabaseUserId { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("role")]
    public string? Role { get; set; }
}

public sealed class VerifyOtpRequest
{
    [JsonPropertyName("supabaseUserId")]
    public string? SupabaseUserId { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("otpCode")]
    public string? OtpCode { get; set; }
}

public sealed class LoginProfileRequest
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }
}

public sealed class PendingRegistration
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
    public string FullName { get; init; } = "";
    public string Role { get; init; } = "Customer";
    public string? SupabaseUserId { get; init; }
}

public record SupportCreateRequest(string CustomerEmail, string Content);
public record FeedbackCreateRequest(string Email, int Rating, string Comment);
public record ReportCreateRequest(string StaffName, string Content);

public sealed class SupportReplyRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("reply")]
    public string? Reply { get; set; }

    public Guid? ResolveId()
    {
        if (Guid.TryParse(Id, out var parsed)) return parsed;
        return null;
    }

    public string? ResolveReply() => Reply;
}

public sealed class ReportReplyRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("adminReply")]
    public string? AdminReply { get; set; }

    public Guid? ResolveId()
    {
        if (Guid.TryParse(Id, out var parsed)) return parsed;
        return null;
    }

    public string? ResolveAdminReply() => AdminReply;
}