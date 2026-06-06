using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MiniSeries.Infrastructure.Persistence;

namespace MiniSeries.Infrastructure.Services;

public sealed class UserPlanQuotaService(MiniSeriesDbContext dbContext)
{
    private static readonly PlanQuota FreePlan = new("Free", 3, 1);
    private static readonly PlanQuota BasicPlan = new("Basic", 30, 10);
    private static readonly PlanQuota PremiumPlan = new("Premium", 100, 50);

    public static PlanQuota ResolvePlan(string? planName)
    {
        var normalized = (planName ?? "").Trim().ToLowerInvariant();
        return normalized switch
        {
            "plus" or "basic" => BasicPlan,
            "pro max" or "promax" or "premium" => PremiumPlan,
            _ => FreePlan
        };
    }

    public async Task<UserPlanQuotaSnapshot> GetSnapshotAsync(Guid userId)
    {
        var profile = await GetProfileAsync(userId);
        var changed = EnsureCurrentPeriod(profile, DateTime.UtcNow);
        if (changed)
        {
            await dbContext.SaveChangesAsync();
        }

        return UserPlanQuotaSnapshot.FromProfile(profile);
    }

    public async Task<UserPlanQuotaSnapshot> ApplyPaidPlanAsync(Guid userId, string? planName)
    {
        var profile = await GetProfileAsync(userId);
        var plan = ResolvePlan(planName);
        var now = DateTime.UtcNow;

        profile.PlanName = plan.Name;
        profile.MangaMonthlyLimit = plan.MangaMonthlyLimit;
        profile.VideoMonthlyLimit = plan.VideoMonthlyLimit;
        profile.UsedMangaCount = 0;
        profile.UsedVideoCount = 0;
        profile.CurrentPeriodStart = now;
        profile.CurrentPeriodEnd = now.AddMonths(1);

        await dbContext.SaveChangesAsync();
        return UserPlanQuotaSnapshot.FromProfile(profile);
    }

    public async Task<QuotaReservationResult> TryReserveGenerationAsync(Guid userId, OutputMode outputMode)
    {
        var profile = await GetProfileAsync(userId);
        EnsureCurrentPeriod(profile, DateTime.UtcNow);

        if (outputMode == OutputMode.Video)
        {
            if (profile.UsedVideoCount >= profile.VideoMonthlyLimit)
            {
                return QuotaReservationResult.Denied(UserPlanQuotaSnapshot.FromProfile(profile));
            }

            profile.UsedVideoCount++;
        }
        else
        {
            if (profile.UsedMangaCount >= profile.MangaMonthlyLimit)
            {
                return QuotaReservationResult.Denied(UserPlanQuotaSnapshot.FromProfile(profile));
            }

            profile.UsedMangaCount++;
        }

        await dbContext.SaveChangesAsync();

        return QuotaReservationResult.Allowed(UserPlanQuotaSnapshot.FromProfile(profile));
    }

    public async Task<UserPlanQuotaSnapshot> RefundGenerationAsync(Guid userId, OutputMode outputMode)
    {
        var profile = await GetProfileAsync(userId);
        if (outputMode == OutputMode.Video && profile.UsedVideoCount > 0)
        {
            profile.UsedVideoCount--;
            await dbContext.SaveChangesAsync();
        }
        else if (outputMode != OutputMode.Video && profile.UsedMangaCount > 0)
        {
            profile.UsedMangaCount--;
            await dbContext.SaveChangesAsync();
        }

        return UserPlanQuotaSnapshot.FromProfile(profile);
    }

    private async Task<UserProfile> GetProfileAsync(Guid userId)
    {
        return await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.Id == userId)
            ?? throw new InvalidOperationException("Khong tim thay ho so nguoi dung.");
    }

    private static bool EnsureCurrentPeriod(UserProfile profile, DateTime now)
    {
        if (profile.CurrentPeriodEnd > now)
        {
            return false;
        }

        var plan = ResolvePlan(profile.PlanName);
        profile.PlanName = plan.Name;
        profile.MangaMonthlyLimit = plan.MangaMonthlyLimit;
        profile.VideoMonthlyLimit = plan.VideoMonthlyLimit;
        profile.UsedMangaCount = 0;
        profile.UsedVideoCount = 0;
        profile.CurrentPeriodStart = now;
        profile.CurrentPeriodEnd = now.AddMonths(1);
        return true;
    }
}

public sealed record PlanQuota(string Name, int MangaMonthlyLimit, int VideoMonthlyLimit)
{
    public int TotalMonthlyLimit => MangaMonthlyLimit + VideoMonthlyLimit;
    public int MonthlyGenerationLimit => TotalMonthlyLimit;
}

public sealed record UserPlanQuotaSnapshot(
    string PlanName,
    int MangaMonthlyLimit,
    int UsedMangaCount,
    int RemainingMangaCount,
    int VideoMonthlyLimit,
    int UsedVideoCount,
    int RemainingVideoCount,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd)
{
    public static UserPlanQuotaSnapshot FromProfile(UserProfile profile)
    {
        var remainingManga = Math.Max(0, profile.MangaMonthlyLimit - profile.UsedMangaCount);
        var remainingVideo = Math.Max(0, profile.VideoMonthlyLimit - profile.UsedVideoCount);
        return new UserPlanQuotaSnapshot(
            profile.PlanName,
            profile.MangaMonthlyLimit,
            profile.UsedMangaCount,
            remainingManga,
            profile.VideoMonthlyLimit,
            profile.UsedVideoCount,
            remainingVideo,
            profile.CurrentPeriodStart,
            profile.CurrentPeriodEnd);
    }

    public int MonthlyGenerationLimit => MangaMonthlyLimit + VideoMonthlyLimit;
    public int UsedGenerationCount => UsedMangaCount + UsedVideoCount;
    public int RemainingGenerationCount => RemainingMangaCount + RemainingVideoCount;
}

public sealed record QuotaReservationResult(
    bool IsAllowed,
    UserPlanQuotaSnapshot Quota)
{
    public static QuotaReservationResult Allowed(UserPlanQuotaSnapshot quota) => new(true, quota);

    public static QuotaReservationResult Denied(UserPlanQuotaSnapshot quota) => new(false, quota);
}
