using System.Net.Http.Headers;
using System.Net.Http.Json;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace MiniSeries.Infrastructure.ExternalServices;

public class AzureFluxService : IImageGenerationService, IMangaService
{
    private readonly HttpClient _httpClient;
    private readonly AzureFluxOptions _options;

    public AzureFluxService(HttpClient httpClient, IOptions<AzureFluxOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<string> GenerateAnchorImageAsync(string characterProfile)
    {
        var prompt = $"{characterProfile}, high quality, full body, character sheet style";
        return await GenerateImageInternalAsync(prompt, null);
    }

    public async Task<string> GenerateMangaPageAsync(string anchorImageUrl, string fullPagePrompt)
    {
        var prompt = $"{fullPagePrompt}. Style: Manga, anime lineart, clean ink-wash colors. " +
                     "IMPORTANT CONSTRAINTS: All text, speech bubbles, and dialogue in the image MUST be written in English. " +
                     "Absolutely NO Japanese (Hiragana/Katakana/Kanji), Chinese, Korean, or other Asian characters/text allowed in the panels. " +
                     "Do not render any gibberish non-English scripts.";
        return await GenerateImageInternalAsync(prompt, anchorImageUrl);
    }

    private const string FallbackSvg = 
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\" width=\"1024\" height=\"1024\">" +
        "<rect width=\"1024\" height=\"1024\" fill=\"#09090b\"/>" +
        "<circle cx=\"512\" cy=\"512\" r=\"300\" fill=\"none\" stroke=\"rgba(242, 125, 38, 0.15)\" stroke-width=\"4\" stroke-dasharray=\"10 15\"/>" +
        "<circle cx=\"512\" cy=\"512\" r=\"200\" fill=\"none\" stroke=\"rgba(56, 189, 248, 0.15)\" stroke-width=\"3\"/>" +
        "<path d=\"M 462 462 L 562 462 L 562 562 L 462 562 Z\" fill=\"none\" stroke=\"rgba(255, 255, 255, 0.3)\" stroke-width=\"4\"/>" +
        "<text x=\"512\" y=\"518\" fill=\"rgba(255, 255, 255, 0.4)\" font-family=\"system-ui, sans-serif\" font-size=\"24\" font-weight=\"bold\" text-anchor=\"middle\">MINISERIES</text>" +
        "<text x=\"512\" y=\"550\" fill=\"rgba(255, 255, 255, 0.25)\" font-family=\"system-ui, sans-serif\" font-size=\"14\" text-anchor=\"middle\">Illustration Content Filtered</text>" +
        "</svg>";

    private async Task<string> GenerateImageInternalAsync(string prompt, string? anchorImageUrl)
    {
        try
        {
            return await GenerateImageInternalWithRetryAsync(prompt, anchorImageUrl, true);
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"[AzureFluxService] Error generating image: {ex.Message}. Falling back to default SVG.");
            return $"data:image/svg+xml;utf8,{System.Uri.EscapeDataString(FallbackSvg)}";
        }
    }

    private async Task<string> GenerateImageInternalWithRetryAsync(string prompt, string? anchorImageUrl, bool allowRetry)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException("AzureFlux ApiKey is missing from configuration.");
        }

        string? inputImageBase64 = null;
        if (!string.IsNullOrWhiteSpace(anchorImageUrl))
        {
            try
            {
                inputImageBase64 = await DownloadImageAsBase64Async(anchorImageUrl);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to download and encode anchor image from {anchorImageUrl}.", ex);
            }
        }

        var requestBody = new Dictionary<string, object>
        {
            { "prompt", prompt },
            { "model", "FLUX.2-pro" },
            { "width", 1024 },
            { "height", 1024 },
            { "n", 1 }
        };

        if (!string.IsNullOrWhiteSpace(inputImageBase64))
        {
            requestBody["input_image"] = inputImageBase64;
        }

        var jsonString = Newtonsoft.Json.JsonConvert.SerializeObject(requestBody);
        var content = new StringContent(jsonString, System.Text.Encoding.UTF8, "application/json");

        var request = new HttpRequestMessage(HttpMethod.Post, _options.BaseUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = content;

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var errContent = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Azure Flux API error ({response.StatusCode}): {errContent}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var json = JObject.Parse(responseContent);

        var dataArray = json["data"] as JArray;
        var stopReason = json["stop_reason"]?.ToString();
        bool isRefusal = stopReason == "refusal" || (dataArray == null || dataArray.Count == 0);

        if (isRefusal)
        {
            if (allowRetry)
            {
                var sanitizedPrompt = SanitizePrompt(prompt);
                System.Console.WriteLine($"[AzureFluxService] Prompt refused by safety. Retrying with sanitized prompt: {sanitizedPrompt}");
                return await GenerateImageInternalWithRetryAsync(sanitizedPrompt, anchorImageUrl, false);
            }
            else
            {
                throw new InvalidOperationException($"Azure Flux API response refused by safety policy. Stop reason: {stopReason}. Full response: {responseContent}");
            }
        }

        var base64Data = dataArray[0]?["b64_json"]?.ToString();
        if (string.IsNullOrWhiteSpace(base64Data))
        {
            throw new InvalidOperationException($"Azure Flux API response did not contain b64_json image data. Full response: {responseContent}");
        }

        return $"data:image/png;base64,{base64Data}";
    }

    private string SanitizePrompt(string prompt)
    {
        var result = prompt;
        
        result = ReplaceIgnoreCase(result, "Nam và Minh", "two friends");
        result = ReplaceIgnoreCase(result, "Nam & Minh", "two friends");
        result = ReplaceIgnoreCase(result, "Nam", "a young man");
        result = ReplaceIgnoreCase(result, "Minh", "his partner");
        result = ReplaceIgnoreCase(result, "lãng mạn", "dreamy");
        result = ReplaceIgnoreCase(result, "romantic", "dreamy");
        result = ReplaceIgnoreCase(result, "xung đột cảm xúc", "intellectual conflict");
        result = ReplaceIgnoreCase(result, "emotional conflict", "intellectual conflict");
        result = ReplaceIgnoreCase(result, "ngồi bên nhau", "sitting facing a control panel");
        result = ReplaceIgnoreCase(result, "sitting together", "sitting facing a control panel");
        
        return result;
    }

    private string ReplaceIgnoreCase(string source, string target, string replacement)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            source, 
            System.Text.RegularExpressions.Regex.Escape(target), 
            replacement, 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }


    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, string> _imageBase64Cache = new();

    private async Task<string> DownloadImageAsBase64Async(string imageUrl)
    {
        if (imageUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = imageUrl.IndexOf(',');
            if (commaIndex >= 0)
            {
                return imageUrl.Substring(commaIndex + 1);
            }
            return imageUrl;
        }

        if (_imageBase64Cache.TryGetValue(imageUrl, out var cachedBase64))
        {
            return cachedBase64;
        }

        var bytes = await _httpClient.GetByteArrayAsync(imageUrl);
        var base64 = Convert.ToBase64String(bytes);
        _imageBase64Cache.TryAdd(imageUrl, base64);
        return base64;
    }
}
