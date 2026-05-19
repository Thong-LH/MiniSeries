using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class MiniSeriesDbContextFactory : IDesignTimeDbContextFactory<MiniSeriesDbContext>
{
    public MiniSeriesDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__MiniSeries")
            ?? Environment.GetEnvironmentVariable("MINISERIES_DATABASE_URL")
            ?? "Host=localhost;Port=5432;Database=miniseries;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<MiniSeriesDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new MiniSeriesDbContext(options);
    }
}
