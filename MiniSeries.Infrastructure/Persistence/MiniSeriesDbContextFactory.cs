using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using System.Text.Json;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class MiniSeriesDbContextFactory : IDesignTimeDbContextFactory<MiniSeriesDbContext>
{
    public MiniSeriesDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__MiniSeries")
            ?? Environment.GetEnvironmentVariable("MINISERIES_DATABASE_URL")
            ?? ReadConnectionStringFromWebApiConfig("appsettings.local.json")
            ?? ReadConnectionStringFromWebApiConfig("appsettings.json")
            ?? "Host=localhost;Port=5432;Database=miniseries;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<MiniSeriesDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new MiniSeriesDbContext(options);
    }

    private static string? ReadConnectionStringFromWebApiConfig(string fileName)
    {
        var current = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "MiniSeries.WebAPI", fileName);
            if (File.Exists(candidate))
            {
                return TryReadMiniSeriesConnectionString(candidate);
            }

            current = current.Parent;
        }

        return null;
    }

    private static string? TryReadMiniSeriesConnectionString(string path)
    {
        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(path));
            if (!doc.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings))
            {
                return null;
            }

            if (!connectionStrings.TryGetProperty("MiniSeries", out var miniSeries))
            {
                return null;
            }

            var value = miniSeries.GetString();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
        catch
        {
            return null;
        }
    }
}
