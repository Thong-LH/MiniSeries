namespace MiniSeries.Domain.Entities;

public class StaffReport
{
    public Guid Id { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string AdminReply { get; set; } = string.Empty;
    public string Status { get; set; } = "Chờ duyệt";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
