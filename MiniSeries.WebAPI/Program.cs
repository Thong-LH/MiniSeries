 using Microsoft.EntityFrameworkCore;
using MiniSeries.WebAPI.Extensions;
using MiniSeries.WebAPI.Middleware;
using MiniSeries.WebAPI.Hubs;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Infrastructure.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    "appsettings.local.json",
    optional: true,
    reloadOnChange: false);

builder.Services.AddMiniSeriesServices(builder.Configuration);
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddSignalR();
builder.Services.AddSingleton<ILessonStatusNotifier, SignalRLessonStatusNotifier>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow all origins while supporting credentials
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR WebSocket connections
    });
});

var app = builder.Build();

// Khởi chạy tiến trình khởi động lạnh (Warmup) Database và EF Core trong nền khi server start
_ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetService<MiniSeries.Infrastructure.Persistence.MiniSeriesDbContext>();
        if (dbContext is not null)
        {
            // Kích hoạt compilation model và khởi tạo connection đầu tiên
            if (await dbContext.Database.CanConnectAsync())
            {
                // Chỉ thực hiện truy vấn đọc nhẹ để khởi động EF Core warm-up và Model compilation
                _ = await dbContext.UserProfiles
                    .AsNoTracking()
                    .Select(p => p.Id)
                    .FirstOrDefaultAsync();
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database Warmup/Migration Error] {ex.Message}");
    }
});

app.UseCors();
app.UseMiddleware<ExceptionHandlingMiddleware>();
// app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<LessonHub>("/hubs/lessons");
app.MapHub<PaymentHub>("/hubs/payments");

app.Run();
