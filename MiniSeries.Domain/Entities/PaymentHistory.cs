using System;
using System.ComponentModel.DataAnnotations.Schema;

[Table("payment_histories")]
public class PaymentHistory
{
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public string UserId { get; set; }

    [Column("user_email")]
    public string UserEmail { get; set; }

    [Column("payment_code")]
    public string PaymentCode { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("plan_name")]
    public string PlanName { get; set; }

    [Column("tokens_received")]
    public int TokensReceived { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("status")]
    public string Status { get; set; } = "Thành công";
}