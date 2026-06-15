namespace MiniSeries.Domain.Entities;

public sealed class PaymentHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int? PaymentOrderId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string UserEmail { get; set; } = string.Empty;

    public string PaymentCode { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string PlanName { get; set; } = string.Empty;

    public int TokensReceived { get; set; }

    public string Status { get; set; } = "Success";

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? PaidAt { get; set; }
}
