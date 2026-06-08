namespace MiniSeries.Domain.Entities;

public sealed class UserProfile
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer";
    public string PlanName { get; set; } = "Free";
    public int MangaMonthlyLimit { get; set; } = 3;
    public int UsedMangaCount { get; set; }
    public int VideoMonthlyLimit { get; set; } = 1;
    public int UsedVideoCount { get; set; }
    public DateTime CurrentPeriodStart { get; set; } = DateTime.UtcNow;
    public DateTime CurrentPeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
