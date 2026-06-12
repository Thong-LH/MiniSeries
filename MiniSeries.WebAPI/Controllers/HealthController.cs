using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Infrastructure.ExternalServices;
using MiniSeries.Infrastructure.Persistence;

namespace MiniSeries.WebAPI.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(
    MiniSeriesDbContext dbContext,
    SupabaseAuthService authService,
    ILogger<HealthController> logger) : ControllerBase
{
    [HttpGet("warmup")]
    public async Task<IActionResult> Warmup(CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();

        try
        {
            await dbContext.Database.CanConnectAsync(cancellationToken);
            await dbContext.UserProfiles
                .AsNoTracking()
                .OrderBy(profile => profile.Id)
                .Select(profile => profile.Id)
                .FirstOrDefaultAsync(cancellationToken);

            logger.LogInformation("Warmup timing: database and UserProfiles query completed in {ElapsedMs}ms.", sw.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Warmup database check failed after {ElapsedMs}ms.", sw.ElapsedMilliseconds);
        }

        try
        {
            await authService.WarmupAsync(cancellationToken);
            logger.LogInformation("Warmup timing: Supabase auth completed in {ElapsedMs}ms.", sw.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Warmup Supabase auth check failed after {ElapsedMs}ms.", sw.ElapsedMilliseconds);
        }

        return Ok(new
        {
            status = "ok",
            elapsedMs = sw.ElapsedMilliseconds
        });
    }
}
