using MiniSeries.Domain.Enums;

namespace MiniSeries.Domain.Entities;

public class GenerationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GenerationJobId { get; set; }
    public GenerationLogLevel Level { get; set; } = GenerationLogLevel.Info;
    public string Step { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? PayloadJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
