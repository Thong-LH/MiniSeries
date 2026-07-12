using System.Text.Json.Serialization;

namespace MiniSeries.WebAPI.Contracts;

public record UpdateProfileDto(string FullName, string? PhoneNumber, string? AvatarUrl);

public sealed class CreateInvoiceRequest
{
    [JsonPropertyName("userId")]
    public string? UserId { get; set; }

    [JsonPropertyName("userEmail")]
    public string? UserEmail { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("tokens")]
    public int Tokens { get; set; }

    [JsonPropertyName("planName")]
    public string? PlanName { get; set; }
}

public class BankWebhookModel
{
    public string Content { get; set; } = string.Empty;
    public string? TransactionContent { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal Amount { get; set; }
}

public sealed class RegisterProfileRequest
{
    [JsonPropertyName("supabaseUserId")]
    public string? SupabaseUserId { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("role")]
    public string? Role { get; set; }
}

public sealed class VerifyOtpRequest
{
    [JsonPropertyName("supabaseUserId")]
    public string? SupabaseUserId { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("otpCode")]
    public string? OtpCode { get; set; }
}

public sealed class LoginProfileRequest
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }
}

public sealed class PendingRegistration
{
    public string Email { get; init; } = "";
    public string Password { get; init; } = "";
    public string FullName { get; init; } = "";
    public string Role { get; init; } = "Customer";
    public string? SupabaseUserId { get; init; }
}

public record SupportCreateRequest(
    [property: JsonPropertyName("customerEmail")] string CustomerEmail,
    [property: JsonPropertyName("content")] string Content
);

public record FeedbackCreateRequest(
    [property: JsonPropertyName("rating")] int Rating,
    [property: JsonPropertyName("comment")] string Comment
);

public record ReportCreateRequest(
    [property: JsonPropertyName("staffName")] string StaffName,
    [property: JsonPropertyName("content")] string Content
);

public sealed class SupportReplyRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("reply")]
    public string? Reply { get; set; }

    public Guid? ResolveId() => Guid.TryParse(Id, out var parsed) ? parsed : null;

    public string? ResolveReply() => Reply;
}

public sealed class ReportReplyRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("adminReply")]
    public string? AdminReply { get; set; }

    public Guid? ResolveId() => Guid.TryParse(Id, out var parsed) ? parsed : null;

    public string? ResolveAdminReply() => AdminReply;
}

public sealed class CreateStaffRequest
{
    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }
}

public sealed class UpdateTokenRequest
{
    [JsonPropertyName("mangaDelta")]
    public int? MangaDelta { get; set; }

    [JsonPropertyName("videoDelta")]
    public int? VideoDelta { get; set; }

    [JsonPropertyName("planName")]
    public string? PlanName { get; set; }
}

public sealed class GoogleSignInRequest
{
    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }
}

public sealed class ForgotPasswordRequest
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }
}

public sealed class ResetPasswordRequest
{
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("otpCode")]
    public string? OtpCode { get; set; }

    [JsonPropertyName("newPassword")]
    public string? NewPassword { get; set; }
}
