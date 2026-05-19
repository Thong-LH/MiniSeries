using MiniSeries.Domain.Enums;

namespace MiniSeries.Domain.Entities;

public class GenerationJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LessonId { get; set; }
    public GenerationJobType Type { get; set; }
    public GenerationJobStatus Status { get; set; } = GenerationJobStatus.Pending;
    public string CurrentStep { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<GenerationLog> Logs { get; set; } = new();
}
