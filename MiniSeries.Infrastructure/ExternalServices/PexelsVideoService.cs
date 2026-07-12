using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Infrastructure.Options;

namespace MiniSeries.Infrastructure.ExternalServices;

public sealed class PexelsVideoService(HttpClient httpClient, IOptions<PexelsOptions> options)
    : IVideoService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly PexelsOptions _options = options.Value;

    public async Task<string> GenerateVideoClipAsync(string anchorImageUrl, string action)
    {
        _ = anchorImageUrl;

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return GetPlaceholderVideo();
        }

        try
        {
            EnsureConfigured();

            var queries = new[]
            {
                BuildSearchQuery(action),
                "education learning",
                "classroom learning"
            }.Distinct(StringComparer.OrdinalIgnoreCase);

            foreach (var query in queries)
            {
                var videoUrl = await SearchVideoAsync(query);
                if (!string.IsNullOrWhiteSpace(videoUrl))
                {
                    return videoUrl;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Pexels search failed: {ex.Message}. Falling back to placeholder video.");
        }

        return GetPlaceholderVideo();
    }

    private string GetPlaceholderVideo()
    {
        var fallbacks = new[]
        {
            "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d69324da7e72166f272c47ab6a&profile_id=139&oauth2_token_id=57447761", // Lớp học truyền thống
            "https://player.vimeo.com/external/435674703.sd.mp4?s=7f5a0dbd83ef3707248f219d3bdfd812239d57a2&profile_id=165&oauth2_token_id=57447761", // Học sinh tự học trực tuyến
            "https://player.vimeo.com/external/403759902.sd.mp4?s=d760773d740c068307cae884e60bc4b971a8080d&profile_id=165&oauth2_token_id=57447761", // Đọc sách/nghiên cứu tài liệu
            "https://player.vimeo.com/external/370331493.sd.mp4?s=9148d2eb4b7b3967d7168673a5667ebf82b7c4f4&profile_id=139&oauth2_token_id=57447761", // Học nhóm/thảo luận
            "https://player.vimeo.com/external/477113337.sd.mp4?s=b653457e5e3c880816ec5188f579893d9ef96a09&profile_id=165&oauth2_token_id=57447761"  // Trẻ em làm thí nghiệm khoa học vui
        };

        return fallbacks[Random.Shared.Next(fallbacks.Length)];
    }


    private async Task<string?> SearchVideoAsync(string query)
    {
        var url = $"{_options.BaseUrl.TrimEnd('/')}/v1/videos/search" +
                  $"?query={Uri.EscapeDataString(query)}" +
                  "&orientation=landscape" +
                  "&size=medium" +
                  "&per_page=8";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue(_options.ApiKey);

        using var response = await httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Pexels video search failed: HTTP {(int)response.StatusCode} - {body}");
        }

        var result = JsonSerializer.Deserialize<PexelsVideoSearchResponse>(body, JsonOptions)
            ?? throw new InvalidOperationException("Pexels video search returned an invalid response.");

        return result.Videos
            .SelectMany(video => video.VideoFiles.Select(file => new { video.Duration, File = file }))
            .Where(x => !string.IsNullOrWhiteSpace(x.File.Link))
            .Where(x => x.File.FileType.Contains("mp4", StringComparison.OrdinalIgnoreCase))
            .Where(x => x.File.Width >= 640 && x.File.Height >= 360)
            .OrderByDescending(x => x.File.Width <= 1920)
            .ThenBy(x => Math.Abs(x.File.Width - 1280))
            .ThenBy(x => Math.Abs(x.Duration - 12))
            .Select(x => x.File.Link)
            .FirstOrDefault();
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException("Pexels is not configured. Set Pexels:ApiKey.");
        }

        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            _options.BaseUrl = "https://api.pexels.com";
        }
    }

    private static string BuildSearchQuery(string action)
    {
        var text = string.Join(
            " ",
            (action ?? string.Empty)
                .Replace('\r', ' ')
                .Replace('\n', ' ')
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(word => word.Length > 2)
                .Take(14));

        if (string.IsNullOrWhiteSpace(text))
        {
            return "education classroom learning";
        }

        if (text.Length > 120)
        {
            text = text[..120];
        }

        return text;
    }
}

internal sealed class PexelsVideoSearchResponse
{
    public List<PexelsVideo> Videos { get; set; } = [];
}

internal sealed class PexelsVideo
{
    public int Duration { get; set; }

    [JsonPropertyName("video_files")]
    public List<PexelsVideoFile> VideoFiles { get; set; } = [];
}

internal sealed class PexelsVideoFile
{
    public string Link { get; set; } = string.Empty;

    [JsonPropertyName("file_type")]
    public string FileType { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
}
