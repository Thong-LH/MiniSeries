using System;

namespace MiniSeries.Domain.Entities
{
    public class UserProfile
    {
        public Guid Id { get; set; } // Sẽ khớp với ID do Supabase Auth sinh ra
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // Các giá trị: Customer, Staff, Admin
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}