using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MiniSeries.Infrastructure.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

/// <summary>
/// Gọi Supabase PostgREST (REST API) bằng Anon Key — không cần EF migration.
/// </summary>
public sealed class SupabaseRestService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    private readonly HttpClient _http;
    private readonly SupabaseOptions _options;

    public SupabaseRestService(HttpClient http, IOptions<SupabaseOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.Url) || string.IsNullOrWhiteSpace(_options.AnonKey))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình Supabase:Url hoặc Supabase:AnonKey trong appsettings.json.");
        }
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string table, string? query = null)
    {
        var baseUrl = _options.Url.TrimEnd('/');
        var url = string.IsNullOrWhiteSpace(query)
            ? $"{baseUrl}/rest/v1/{table}"
            : $"{baseUrl}/rest/v1/{table}?{query}";

        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("apikey", _options.AnonKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AnonKey);
        return request;
    }

    private static async Task<string> ReadErrorAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(body))
        {
            return $"Supabase HTTP {(int)response.StatusCode}";
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("message", out var msg))
            {
                return msg.GetString() ?? body;
            }
        }
        catch
        {
            // ignore parse errors
        }

        return body;
    }

    private async Task<T?> PostAsync<T>(string table, object payload) where T : class
    {
        EnsureConfigured();
        using var request = CreateRequest(HttpMethod.Post, table);
        request.Headers.Add("Prefer", "return=representation");
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }

        var json = await response.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
        return list is { Count: > 0 } ? list[0] : null;
    }

    private async Task<List<T>> GetListAsync<T>(string table, string orderColumn)
    {
        EnsureConfigured();
        var query = $"select=*&order={orderColumn}.desc";
        using var request = CreateRequest(HttpMethod.Get, table, query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? [];
    }

    private async Task<T?> PatchByIdAsync<T>(string table, Guid id, object patch) where T : class
    {
        EnsureConfigured();
        // Bảng tạo bằng "Id" (PascalCase) — PostgREST phải dùng đúng tên cột
        var query = $"Id=eq.{id:D}";
        using var request = CreateRequest(HttpMethod.Patch, table, query);
        request.Headers.Add("Prefer", "return=representation");
        request.Content = new StringContent(
            JsonSerializer.Serialize(patch, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }

        var json = await response.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
        return list is { Count: > 0 } ? list[0] : null;
    }

    public Task<SupabaseSupportRow?> CreateSupportAsync(string customerEmail, string content) =>
        PostAsync<SupabaseSupportRow>("SupportRequests", new
        {
            Id = Guid.NewGuid(),
            CustomerEmail = customerEmail,
            Content = content,
            Reply = "",
            Status = "Chờ trả lời",
            CreatedAt = DateTime.UtcNow
        });

    public Task<List<SupabaseSupportRow>> ListSupportAsync() =>
        GetListAsync<SupabaseSupportRow>("SupportRequests", "CreatedAt");

    public Task<SupabaseSupportRow?> ReplySupportAsync(Guid id, string reply) =>
        PatchByIdAsync<SupabaseSupportRow>("SupportRequests", id, new
        {
            Reply = reply,
            Status = "Đã trả lời"
        });

    public Task<SupabaseFeedbackRow?> CreateFeedbackAsync(string email, int rating, string comment) =>
        PostAsync<SupabaseFeedbackRow>("Feedbacks", new
        {
            Id = Guid.NewGuid(),
            Email = email,
            Rating = rating,
            Comment = comment,
            CreatedAt = DateTime.UtcNow
        });

    public Task<List<SupabaseFeedbackRow>> ListFeedbacksAsync() =>
        GetListAsync<SupabaseFeedbackRow>("Feedbacks", "CreatedAt");

    public Task<SupabaseReportRow?> CreateReportAsync(string staffName, string content) =>
        PostAsync<SupabaseReportRow>("StaffReports", new
        {
            Id = Guid.NewGuid(),
            StaffName = staffName,
            Content = content,
            AdminReply = "",
            Status = "Chờ duyệt",
            CreatedAt = DateTime.UtcNow
        });

    public Task<List<SupabaseReportRow>> ListReportsAsync() =>
        GetListAsync<SupabaseReportRow>("StaffReports", "CreatedAt");

    public Task<SupabaseReportRow?> ReplyReportAsync(Guid id, string adminReply) =>
        PatchByIdAsync<SupabaseReportRow>("StaffReports", id, new
        {
            AdminReply = adminReply,
            Status = "Đã hoàn thành"
        });

    public Task<SupabaseUserProfileRow?> CreateUserProfileAsync(Guid id, string email, string fullName, string role) =>
        PostAsync<SupabaseUserProfileRow>("UserProfiles", new
        {
            Id = id,
            Email = email.Trim(),
            FullName = fullName.Trim(),
            Role = string.IsNullOrWhiteSpace(role) ? "Customer" : role.Trim(),
            PlanName = "Free",
            MangaMonthlyLimit = 3,
            UsedMangaCount = 0,
            VideoMonthlyLimit = 1,
            UsedVideoCount = 0,
            CurrentPeriodStart = DateTime.UtcNow,
            CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow
        });

    public async Task<SupabaseUserProfileRow?> GetUserProfileByIdAsync(Guid id)
    {
        EnsureConfigured();
        var query = $"Id=eq.{id:D}&select=*";
        using var request = CreateRequest(HttpMethod.Get, "UserProfiles", query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }
        var json = await response.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<SupabaseUserProfileRow>>(json, JsonOptions);
        return list is { Count: > 0 } ? list[0] : null;
    }

    public async Task<SupabaseUserProfileRow?> GetUserProfileByEmailAsync(string email)
    {
        EnsureConfigured();
        var query = $"Email=eq.{Uri.EscapeDataString(email.Trim())}&select=*";
        using var request = CreateRequest(HttpMethod.Get, "UserProfiles", query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }
        var json = await response.Content.ReadAsStringAsync();
        var list = JsonSerializer.Deserialize<List<SupabaseUserProfileRow>>(json, JsonOptions);
        return list is { Count: > 0 } ? list[0] : null;
    }

    public async Task<List<SupabaseUserProfileRow>> ListCustomersAsync()
    {
        EnsureConfigured();
        var query = "Role=eq.Customer&select=*&order=CreatedAt.desc";
        using var request = CreateRequest(HttpMethod.Get, "UserProfiles", query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<SupabaseUserProfileRow>>(json, JsonOptions) ?? [];
    }
    public async Task<List<SupabaseUserProfileRow>> ListStaffsAsync()
    {
        EnsureConfigured();
        // Lọc những User có quyền là 'Staff' từ bảng 'UserProfiles'
        var query = "Role=eq.Staff&select=*&order=CreatedAt.desc";
        using var request = CreateRequest(HttpMethod.Get, "UserProfiles", query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<SupabaseUserProfileRow>>(json, JsonOptions) ?? [];
    }

    public Task<SupabasePaymentHistoryRow?> InsertPaymentHistoryAsync(
        string userEmail,
        decimal amount,
        string transactionCode,
        string content) =>
        PostAsync<SupabasePaymentHistoryRow>("PaymentHistory", new
        {
            Id = Guid.NewGuid(),
            UserEmail = userEmail.Trim(),
            Amount = amount,
            TransactionCode = transactionCode.Trim(),
            Content = content,
            CreatedAt = DateTime.UtcNow
        });

    public Task<List<SupabasePaymentHistoryRow>> ListPaymentHistoryAsync() =>
        GetListAsync<SupabasePaymentHistoryRow>("PaymentHistory", "CreatedAt");

    private async Task<bool> DeleteByIdAsync(string table, Guid id)
    {
        EnsureConfigured();
        var query = $"Id=eq.{id:D}";
        using var request = CreateRequest(HttpMethod.Delete, table, query);
        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await ReadErrorAsync(response));
        }
        return true;
    }

    public Task<SupabaseUserProfileRow?> UpdateUserProfileAsync(Guid id, object patch) =>
        PatchByIdAsync<SupabaseUserProfileRow>("UserProfiles", id, patch);

    public Task<bool> DeleteUserProfileAsync(Guid id) =>
        DeleteByIdAsync("UserProfiles", id);

    public async Task<TokenSummaryResponse> GetTokenSummaryAsync()
    {
        var customers = await ListCustomersAsync();
        var totalTokens = customers.Sum(c => c.TokenBalance);
        var plusCount = customers.Count(c =>
            string.Equals(c.PlanName, "Plus", StringComparison.OrdinalIgnoreCase));
        var proMaxCount = customers.Count(c =>
            string.Equals(c.PlanName, "Pro Max", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(c.PlanName, "ProMax", StringComparison.OrdinalIgnoreCase));

        return new TokenSummaryResponse
        {
            TotalTokensIssued = totalTokens,
            PlusPackageCount = plusCount,
            ProMaxPackageCount = proMaxCount
        };
    }

    public async Task<SupabaseUserProfileRow?> AdjustUserTokenAndPlanAsync(
        Guid userId,
        int? tokenDelta,
        string? planName)
    {
        var profile = await GetUserProfileByIdAsync(userId);
        if (profile is null)
        {
            return null;
        }

        var patch = new Dictionary<string, object?>();
        if (tokenDelta is not null && tokenDelta.Value != 0)
        {
            var newBalance = Math.Max(0, profile.TokenBalance + tokenDelta.Value);
            patch["TokenBalance"] = newBalance;
        }

        if (!string.IsNullOrWhiteSpace(planName))
        {
            var normalized = NormalizePlanName(planName);
            patch["PlanName"] = normalized;
        }

        if (patch.Count == 0)
        {
            return profile;
        }

        return await PatchByIdAsync<SupabaseUserProfileRow>("UserProfiles", userId, patch);
    }

    private static string NormalizePlanName(string planName)
    {
        var p = planName.Trim();
        if (p.Equals("plus", StringComparison.OrdinalIgnoreCase)) return "Plus";
        if (p.Equals("pro max", StringComparison.OrdinalIgnoreCase) ||
            p.Equals("promax", StringComparison.OrdinalIgnoreCase)) return "Pro Max";
        return "Free";
    }

    public async Task<PaymentStatsResponse> GetPaymentStatsAsync(string groupBy = "month")
    {
        var rows = await ListPaymentHistoryAsync();
        var grouped = rows
            .GroupBy(r =>
            {
                var dt = r.CreatedAt;
                return groupBy.Equals("day", StringComparison.OrdinalIgnoreCase)
                    ? dt.ToString("yyyy-MM-dd")
                    : dt.ToString("yyyy-MM");
            })
            .OrderBy(g => g.Key)
            .Select(g => new { Label = g.Key, Amount = g.Sum(x => x.Amount) })
            .ToList();

        return new PaymentStatsResponse
        {
            Labels = grouped.Select(x => x.Label).ToList(),
            Amounts = grouped.Select(x => x.Amount).ToList(),
            TotalRevenue = rows.Sum(x => x.Amount),
            TransactionCount = rows.Count
        };
    }
}

public sealed class SupabaseUserProfileRow
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "Customer";
    public string AccountStatus { get; set; } = "Active";
    public string PlanName { get; set; } = "Free";
    public int TokenBalance { get; set; }
    public int MangaMonthlyLimit { get; set; } = 3;
    public int UsedMangaCount { get; set; }
    public int VideoMonthlyLimit { get; set; } = 1;
    public int UsedVideoCount { get; set; }
    public DateTime CurrentPeriodStart { get; set; }
    public DateTime CurrentPeriodEnd { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class SupabasePaymentHistoryRow
{
    public Guid Id { get; set; }
    public string UserEmail { get; set; } = "";
    public decimal Amount { get; set; }
    public string TransactionCode { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public sealed class PaymentStatsResponse
{
    public List<string> Labels { get; set; } = [];
    public List<decimal> Amounts { get; set; } = [];
    public decimal TotalRevenue { get; set; }
    public int TransactionCount { get; set; }
}

public sealed class TokenSummaryResponse
{
    public int TotalTokensIssued { get; set; }
    public int PlusPackageCount { get; set; }
    public int ProMaxPackageCount { get; set; }
}

public sealed class SupabaseSupportRow
{
    public Guid Id { get; set; }
    public string CustomerEmail { get; set; } = "";
    public string Content { get; set; } = "";
    public string Reply { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public sealed class SupabaseFeedbackRow
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public int Rating { get; set; }
    public string Comment { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public sealed class SupabaseReportRow
{
    public Guid Id { get; set; }
    public string StaffName { get; set; } = "";
    public string Content { get; set; } = "";
    public string AdminReply { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
