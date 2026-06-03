using MiniSeries.Domain.Enums;

namespace MiniSeries.Domain.Entities;

public class Lesson
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string RawContent { get; set; } = string.Empty;
    public CreativeMode CreativeMode { get; set; } = CreativeMode.Auto;
    public string? CreativeBrief { get; set; }
    public OutputMode OutputMode { get; set; } = OutputMode.Manga;
    public ScriptStatus ScriptStatus { get; set; } = ScriptStatus.Draft;
    public string CharacterProfile { get; set; } = string.Empty;
    public string OverallScript { get; set; } = string.Empty;
    public string AnchorImageUrl { get; set; } = string.Empty;
    public List<Chapter> Chapters { get; set; } = new();
    public List<LlmJson> LlmJsons { get; set; } = new();
    public List<GenerationJob> GenerationJobs { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
}
