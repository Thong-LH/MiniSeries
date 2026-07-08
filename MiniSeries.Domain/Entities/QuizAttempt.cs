using System;

namespace MiniSeries.Domain.Entities
{
    public class QuizAttempt
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid ChapterId { get; set; }
        public string SelectedOption { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
