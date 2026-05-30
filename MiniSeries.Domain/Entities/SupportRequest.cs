namespace MiniSeries.Domain.Entities;

public class SupportRequest
{
    public Guid Id { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Reply { get; set; } = string.Empty;
    public string Status { get; set; } = "Chờ trả lời";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
