namespace MiniSeries.Domain.Entities;

public class Feedback
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
