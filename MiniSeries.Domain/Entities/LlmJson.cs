using MiniSeries.Domain.Enums;

namespace MiniSeries.Domain.Entities;

public class LlmJson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public LlmJsonPurpose Purpose { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string RawJson { get; set; } = string.Empty;
    public string? Feedback { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
