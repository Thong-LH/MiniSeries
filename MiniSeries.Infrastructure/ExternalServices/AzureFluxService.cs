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

    private async Task<string> GenerateImageInternalAsync(string prompt, string? anchorImageUrl)
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
        if (dataArray == null || dataArray.Count == 0)
        {
            throw new InvalidOperationException($"Azure Flux API response 'data' array is null or empty. Full response: {responseContent}");
        }

        var base64Data = dataArray[0]?["b64_json"]?.ToString();
        if (string.IsNullOrWhiteSpace(base64Data))
        {
            throw new InvalidOperationException($"Azure Flux API response did not contain b64_json image data. Full response: {responseContent}");
        }

        return $"data:image/png;base64,{base64Data}";
    }

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

        var bytes = await _httpClient.GetByteArrayAsync(imageUrl);
        return Convert.ToBase64String(bytes);
    }
}
