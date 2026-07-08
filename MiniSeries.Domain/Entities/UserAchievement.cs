using System;

namespace MiniSeries.Domain.Entities
{
    public class UserAchievement
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string AchievementKey { get; set; } = string.Empty;
        public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
    }
}
