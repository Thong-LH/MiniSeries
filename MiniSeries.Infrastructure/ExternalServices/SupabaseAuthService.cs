using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using MiniSeries.Infrastructure.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

/// <summary>
/// Supabase Auth (GoTrue) — SignUp / SignIn qua REST API (tương đương supabase.Auth).
/// </summary>
public sealed class SupabaseAuthService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _http;
    private readonly SupabaseOptions _options;

    public SupabaseAuthService(HttpClient http, IOptions<SupabaseOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.Url) || string.IsNullOrWhiteSpace(_options.AnonKey))
        {
            throw new InvalidOperationException("Chưa cấu hình Supabase:Url hoặc Supabase:AnonKey.");
        }
    }

    private HttpRequestMessage CreateAuthRequest(HttpMethod method, string path, HttpContent? content = null)
    {
        var url = $"{_options.Url.TrimEnd('/')}/auth/v1/{path}";
        var request = new HttpRequestMessage(method, url);
        request.Headers.Add("apikey", _options.AnonKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AnonKey);
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
            if (doc.RootElement.TryGetProperty("error_description", out var desc))
            {
                return desc.GetString() ?? body;
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

  /// <summary>supabase.Auth.SignUp — tạo user trên Supabase Auth.</summary>
    public async Task<SupabaseAuthSession> SignUpAsync(string email, string password, string? fullName = null)
    {
        EnsureConfigured();
        var payload = new Dictionary<string, object?>
        {
            ["email"] = email.Trim(),
            ["password"] = password
        };
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            payload["data"] = new Dictionary<string, object?> { ["full_name"] = fullName.Trim() };
        }

        using var request = CreateAuthRequest(HttpMethod.Post, "signup",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(ParseAuthError(body));
        }

        return ParseSession(body) ?? throw new InvalidOperationException("Supabase Auth không trả về thông tin user.");
    }

    /// <summary>supabase.Auth.SignIn — đăng nhập email/password.</summary>
    public async Task<SupabaseAuthSession> SignInAsync(string email, string password)
    {
        EnsureConfigured();
        var payload = new { email = email.Trim(), password };
        using var request = CreateAuthRequest(HttpMethod.Post, "token?grant_type=password",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

        using var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(ParseAuthError(body));
        }

        return ParseSession(body) ?? throw new InvalidOperationException("Đăng nhập thất bại: không nhận được session.");
    }

    private static SupabaseAuthSession? ParseSession(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        Guid? userId = null;
        string? userEmail = null;

        if (root.TryGetProperty("user", out var userEl))
        {
            if (userEl.TryGetProperty("id", out var idEl) && Guid.TryParse(idEl.GetString(), out var uid))
            {
                userId = uid;
            }
            if (userEl.TryGetProperty("email", out var emailEl))
            {
                userEmail = emailEl.GetString();
            }
        }
        else if (root.TryGetProperty("id", out var rootId) && Guid.TryParse(rootId.GetString(), out var rid))
        {
            userId = rid;
            if (root.TryGetProperty("email", out var rootEmail))
            {
                userEmail = rootEmail.GetString();
            }
        }

        if (userId is null)
        {
            return null;
        }

        var accessToken = root.TryGetProperty("access_token", out var tokenEl)
            ? tokenEl.GetString()
            : null;

        return new SupabaseAuthSession(userId.Value, userEmail ?? "", accessToken);
    }
}

public sealed record SupabaseAuthSession(Guid UserId, string Email, string? AccessToken);
