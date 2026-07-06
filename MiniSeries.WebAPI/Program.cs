 using Microsoft.EntityFrameworkCore;
using MiniSeries.WebAPI.Extensions;
using MiniSeries.WebAPI.Middleware;
using MiniSeries.Infrastructure.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    "appsettings.local.json",
    optional: true,
    reloadOnChange: true);

builder.Services.AddMiniSeriesServices(builder.Configuration);
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
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
            if (await dbContext.Database.CanConnectAsync())
            {
                // Tự động cập nhật cột AssignedStaffEmail nếu chưa có để đảm bảo chạy mượt mà
                await dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"SupportRequests\" ADD COLUMN IF NOT EXISTS \"AssignedStaffEmail\" character varying(320);");
                // Cập nhật các ticket cũ chưa được phân phối trong database sang email nhân viên thực tế đầu tiên
                await dbContext.Database.ExecuteSqlRawAsync(@"
                    UPDATE ""SupportRequests"" 
                    SET ""AssignedStaffEmail"" = COALESCE(
                        (SELECT ""Email"" FROM ""UserProfiles"" WHERE ""Role"" = 'Staff' OR ""Role"" = 'staff' OR ""Role"" = 'Admin' OR ""Role"" = 'admin' LIMIT 1),
                        'staff_auto@miniseries.com'
                    ) 
                    WHERE ""AssignedStaffEmail"" IS NULL OR ""AssignedStaffEmail"" = '' OR ""AssignedStaffEmail"" = 'staff_auto@miniseries.com';
                ");

                // Tự động tạo bảng TrafficLogs để phục vụ phân tích lượt truy cập (KAN-81)
                await dbContext.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""TrafficLogs"" (
                        ""Id"" uuid PRIMARY KEY,
                        ""UserId"" character varying(100),
                        ""Path"" character varying(500) NOT NULL,
                        ""IpAddress"" character varying(100) NOT NULL,
                        ""DeviceType"" character varying(50) NOT NULL,
                        ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT now()
                    );
                    CREATE INDEX IF NOT EXISTS ""IX_TrafficLogs_CreatedAt"" ON ""TrafficLogs"" (""CreatedAt"");
                    
                    ALTER TABLE ""TrafficLogs"" ENABLE ROW LEVEL SECURITY;
                    DROP POLICY IF EXISTS ""anon_all_trafficlogs"" ON ""TrafficLogs"";
                    CREATE POLICY ""anon_all_trafficlogs"" ON ""TrafficLogs"" FOR ALL TO anon USING (true) WITH CHECK (true);
                ");
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

app.Run();
