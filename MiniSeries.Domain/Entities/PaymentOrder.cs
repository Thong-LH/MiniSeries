using System;

namespace MiniSeries.Domain.Entities
{
    public class PaymentOrder
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string PaymentCode { get; set; } // Ví dụ: MGX4074
        public int TokensAmount { get; set; }
        public decimal MoneyAmount { get; set; }
        public bool IsCompleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
    }
}