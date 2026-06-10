using System;

namespace MiniSeries.Domain.Entities
{
    public class UserProfile
    {
        public Guid Id { get; set; } // Sẽ khớp với ID do Supabase Auth sinh ra
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // Các giá trị: Customer, Staff, Admin
        public string PlanName { get; set; } = "Free";
        public int MangaMonthlyLimit { get; set; } = 3;
        public int UsedMangaCount { get; set; } = 0;
        public int VideoMonthlyLimit { get; set; } = 1;
        public int UsedVideoCount { get; set; } = 0;
        public DateTime CurrentPeriodStart { get; set; } = DateTime.UtcNow;
        public DateTime CurrentPeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
