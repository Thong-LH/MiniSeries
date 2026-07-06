namespace MiniSeries.Domain.Entities;

public class TrafficLog
{
    public Guid Id { get; set; }
    public string? UserId { get; set; }
    public string Path { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
