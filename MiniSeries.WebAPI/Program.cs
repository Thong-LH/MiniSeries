 using MiniSeries.WebAPI.Extensions;
using MiniSeries.WebAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    "appsettings.local.json",
    optional: true,
    reloadOnChange: true);

builder.Services.AddMiniSeriesServices(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
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
            await dbContext.Database.CanConnectAsync();
        }
    }
    catch
    {
        // Bỏ qua lỗi trong lúc warmup để tránh treo server lúc khởi động
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

app.Run();
