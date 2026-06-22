using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MiniSeries.Infrastructure.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

/// <summary>
/// Supabase Auth Admin API — chỉ gọi từ backend với Service Role Key.
/// </summary>
public sealed class SupabaseAdminAuthService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _http;
    private readonly SupabaseOptions _options;

    public SupabaseAdminAuthService(HttpClient http, IOptions<SupabaseOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    private void EnsureServiceRoleConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.Url) || string.IsNullOrWhiteSpace(_options.ServiceRoleKey))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình Supabase:ServiceRoleKey trong appsettings. Admin không thể tạo/xóa/khóa user.");
        }
    }

    private HttpRequestMessage CreateAdminRequest(HttpMethod method, string path, HttpContent? content = null)
    {
        EnsureServiceRoleConfigured();
        var url = $"{_options.Url.TrimEnd('/')}/auth/v1/{path}";
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("apikey", _options.ServiceRoleKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ServiceRoleKey);
        if (content is not null)
        {
            request.Content = content;
        }
        return request;
    }

    private static string ParseAuthError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("msg", out var msg))
            {
                return msg.GetString() ?? body;
            }
            if (doc.RootElement.TryGetProperty("message", out var message))
            {
                return message.GetString() ?? body;
            }
        }
        catch
        {
            // ignore
        }
        return body;
    }

    public async Task<Guid> CreateUserAsync(string email, string password, string? fullName = null)
    {
        var payload = new Dictionary<string, object?>
        {
            ["email"] = email.Trim(),
            ["password"] = password,
            ["email_confirm"] = true
        };
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            payload["user_metadata"] = new Dictionary<string, object?> { ["full_name"] = fullName.Trim() };
        }

        using var request = CreateAdminRequest(HttpMethod.Post, "admin/users",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(ParseAuthError(body));
        }

        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("id", out var idEl) &&
            Guid.TryParse(idEl.GetString(), out var userId))
        {
            return userId;
        }

        throw new InvalidOperationException("Supabase Admin không trả về user id.");
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        using var request = CreateAdminRequest(HttpMethod.Delete, $"admin/users/{userId:D}");
        using var response = await _http.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync();
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return;
        }

        throw new InvalidOperationException(ParseAuthError(body));
    }

    public async Task SetUserBannedAsync(Guid userId, bool banned)
    {
        var payload = banned
            ? new { ban_duration = "876000h" }
            : new { ban_duration = "none" };

        using var request = CreateAdminRequest(HttpMethod.Put, $"admin/users/{userId:D}",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        using var response = await _http.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException(ParseAuthError(body));
    }

    public async Task UpdateUserPasswordAsync(Guid userId, string newPassword)
    {
        var payload = new { password = newPassword };
        using var request = CreateAdminRequest(HttpMethod.Put, $"admin/users/{userId:D}",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        using var response = await _http.SendAsync(request);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync();
        throw new InvalidOperationException(ParseAuthError(body));
    }
}
