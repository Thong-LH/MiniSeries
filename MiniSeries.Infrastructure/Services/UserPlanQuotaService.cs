using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;

namespace MiniSeries.Infrastructure.Services;

public sealed class UserPlanQuotaService(MiniSeriesDbContext dbContext)
{
    private static readonly PlanQuota FreePlan = new("Free", 3);
    private static readonly PlanQuota BasicPlan = new("Basic", 30);
    private static readonly PlanQuota PremiumPlan = new("Premium", 100);

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
        profile.MonthlyGenerationLimit = plan.MonthlyGenerationLimit;
        profile.UsedGenerationCount = 0;
        profile.CurrentPeriodStart = now;
        profile.CurrentPeriodEnd = now.AddMonths(1);

        await dbContext.SaveChangesAsync();
        return UserPlanQuotaSnapshot.FromProfile(profile);
    }

    public async Task<QuotaReservationResult> TryReserveGenerationAsync(Guid userId)
    {
        var profile = await GetProfileAsync(userId);
        EnsureCurrentPeriod(profile, DateTime.UtcNow);

        if (profile.UsedGenerationCount >= profile.MonthlyGenerationLimit)
        {
            return QuotaReservationResult.Denied(UserPlanQuotaSnapshot.FromProfile(profile));
        }

        profile.UsedGenerationCount++;
        await dbContext.SaveChangesAsync();

        return QuotaReservationResult.Allowed(UserPlanQuotaSnapshot.FromProfile(profile));
    }

    public async Task<UserPlanQuotaSnapshot> RefundGenerationAsync(Guid userId)
    {
        var profile = await GetProfileAsync(userId);
        if (profile.UsedGenerationCount > 0)
        {
            profile.UsedGenerationCount--;
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
        profile.MonthlyGenerationLimit = plan.MonthlyGenerationLimit;
        profile.UsedGenerationCount = 0;
        profile.CurrentPeriodStart = now;
        profile.CurrentPeriodEnd = now.AddMonths(1);
        return true;
    }
}

public sealed record PlanQuota(string Name, int MonthlyGenerationLimit);

public sealed record UserPlanQuotaSnapshot(
    string PlanName,
    int MonthlyGenerationLimit,
    int UsedGenerationCount,
    int RemainingGenerationCount,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd)
{
    public static UserPlanQuotaSnapshot FromProfile(UserProfile profile)
    {
        var remaining = Math.Max(0, profile.MonthlyGenerationLimit - profile.UsedGenerationCount);
        return new UserPlanQuotaSnapshot(
            profile.PlanName,
            profile.MonthlyGenerationLimit,
            profile.UsedGenerationCount,
            remaining,
            profile.CurrentPeriodStart,
            profile.CurrentPeriodEnd);
    }
}

public sealed record QuotaReservationResult(
    bool IsAllowed,
    UserPlanQuotaSnapshot Quota)
{
    public static QuotaReservationResult Allowed(UserPlanQuotaSnapshot quota) => new(true, quota);

    public static QuotaReservationResult Denied(UserPlanQuotaSnapshot quota) => new(false, quota);
}
