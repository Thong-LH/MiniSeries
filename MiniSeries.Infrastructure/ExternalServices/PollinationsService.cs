using MiniSeries.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MiniSeries.Infrastructure.ExternalServices;

public class PollinationsService : IImageGenerationService, IMangaService, IVideoService, IStorageService
{
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public PollinationsService(HttpClient httpClient, IConfiguration configuration)
    {
        _ = httpClient;
        _apiKey = configuration["Pollinations:ApiKey"] ?? throw new ArgumentNullException("Pollinations:ApiKey is missing");
        _baseUrl = configuration["Pollinations:BaseUrl"] ?? "https://gen.pollinations.ai";
    }

    public Task<string> GenerateAnchorImageAsync(string characterProfile)
    {
        var encodedPrompt = Uri.EscapeDataString(characterProfile + ", high quality, full body, character sheet style");
        return Task.FromResult($"{_baseUrl}/image/{encodedPrompt}?width=512&height=512&seed={Random.Shared.Next(1000, 9999)}&key={_apiKey}");
    }

    public Task<string> GenerateMangaPageAsync(string anchorImageUrl, string fullPagePrompt)
    {
        var mangaPrompt = $"{fullPagePrompt}. Style: Manga, anime lineart, clean ink-wash colors, consistent character: {anchorImageUrl}.";
        var encodedPrompt = Uri.EscapeDataString(mangaPrompt);
        return Task.FromResult($"{_baseUrl}/image/{encodedPrompt}?width=512&height=512&key={_apiKey}");
    }

    public Task<string> GenerateVideoClipAsync(string anchorImageUrl, string action)
    {
        var videoPrompt = $"Cinematic educational video, {action}, high quality, consistent character: {anchorImageUrl}";
        var encodedPrompt = Uri.EscapeDataString(videoPrompt);
        return Task.FromResult($"{_baseUrl}/video/{encodedPrompt}?key={_apiKey}");
    }

    public Task<string> UploadAsync(string sourceUrl, string fileName)
    {
        _ = fileName;
        return Task.FromResult(sourceUrl);
    }
}
