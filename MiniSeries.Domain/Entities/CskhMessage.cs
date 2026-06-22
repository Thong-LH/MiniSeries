using System;

namespace MiniSeries.Domain.Entities
{
    public class CskhMessage
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string CustomerEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string SenderRole { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
