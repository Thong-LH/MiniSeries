using System;

namespace MiniSeries.Domain.Entities
{
    public class StudentProgress
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid LessonId { get; set; }
        public int LastReadChapterOrder { get; set; }
        public int ProgressPercentage { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
