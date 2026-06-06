using System;

namespace MiniSeries.Domain.Entities
{
    public class PaymentOrder
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public string PaymentCode { get; set; } = string.Empty;
        public int TokensAmount { get; set; }
        public decimal MoneyAmount { get; set; }
        public string Status { get; set; } = "Pending";
        public bool IsCompleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
    }
}
