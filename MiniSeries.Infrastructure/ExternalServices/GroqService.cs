using System.Net.Http.Headers;
using System.Net.Http.Json;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Common.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace MiniSeries.Infrastructure.ExternalServices;

public class GroqService : ILLMService
{
    private const string Model = "llama-3.3-70b-versatile";

    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public GroqService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Groq:ApiKey"] ?? throw new ArgumentNullException("Groq:ApiKey is missing");
        _baseUrl = configuration["Groq:BaseUrl"] ?? "https://api.groq.com/openai/v1";
    }

    public async Task<ScriptDraftResult> CreateScriptDraftAsync(string rawContent, string? creativeBrief)
    {
        var guidance = string.IsNullOrWhiteSpace(creativeBrief)
            ? "Invent the storytelling direction yourself."
            : $"Respect this user creative brief: {creativeBrief}";

        var prompt = $@"
        Create a high-level educational story script for the lesson below.
        Do NOT break it into chapters yet.
        Return ONLY valid JSON with this exact shape:
        {{
            ""characterProfile"": ""Detailed visual description of the recurring main character."",
            ""overallScript"": ""A coherent overall script/treatment describing the narrative arc, teaching strategy, tone, and how the lesson should unfold from start to finish.""
        }}

        {guidance}

        Lesson content:
        {rawContent}";

        var rawJson = await SendPromptAsync(prompt);
        var parsed = JObject.Parse(rawJson);

        return new ScriptDraftResult
        {
            RawJson = rawJson,
            CharacterProfile = parsed["characterProfile"]?.ToString() ?? string.Empty,
            OverallScript = parsed["overallScript"]?.ToString() ?? string.Empty
        };
    }

    public async Task<ScriptDraftResult> ReviseScriptDraftAsync(
        string rawContent,
        string currentOverallScript,
        string feedback,
        string? creativeBrief)
    {
        var guidance = string.IsNullOrWhiteSpace(creativeBrief)
            ? string.Empty
            : $"Original creative brief: {creativeBrief}\n";

        var prompt = $@"
        Revise the high-level educational story script below using the user's feedback.
        Do NOT break it into chapters yet.
        Return ONLY valid JSON with this exact shape:
        {{
            ""characterProfile"": ""Updated detailed visual description of the recurring main character if needed."",
            ""overallScript"": ""Revised coherent overall script/treatment.""
        }}

        Lesson content:
        {rawContent}

        {guidance}
        Current overall script:
        {currentOverallScript}

        User feedback:
        {feedback}";

        var rawJson = await SendPromptAsync(prompt);
        var parsed = JObject.Parse(rawJson);

        return new ScriptDraftResult
        {
            RawJson = rawJson,
            CharacterProfile = parsed["characterProfile"]?.ToString() ?? string.Empty,
            OverallScript = parsed["overallScript"]?.ToString() ?? string.Empty
        };
    }

    public async Task<ChapterDraftResult> CreateChaptersAsync(
        string rawContent,
        string approvedOverallScript,
        string characterProfile)
    {
        var prompt = $@"
        Using the approved overall script below, break the lesson into 3 to 4 manga chapters/pages.
        Each chapter is ONE final generated page image.
        For each chapter, produce a detailed full-page prompt that already describes the internal panels and speech bubbles.
        Return ONLY valid JSON with this exact shape:
        {{
            ""chapters"": [
                {{
                    ""chapterNumber"": 1,
                    ""summary"": ""Brief summary of the chapter."",
                    ""fullPrompt"": ""A detailed prompt for one manga page, including multiple panels and dialogue.""
                }}
            ]
        }}

        Lesson content:
        {rawContent}

        Approved overall script:
        {approvedOverallScript}

        Recurring character profile:
        {characterProfile}";

        var rawJson = await SendPromptAsync(prompt);
        var parsed = JObject.Parse(rawJson);
        var chaptersJson = parsed["chapters"] as JArray;
        var chapters = new List<ChapterDraftItem>();

        if (chaptersJson is not null)
        {
            foreach (var chapter in chaptersJson)
            {
                chapters.Add(new ChapterDraftItem
                {
                    Order = chapter["chapterNumber"]?.Value<int>() ?? 0,
                    Summary = chapter["summary"]?.ToString() ?? string.Empty,
                    FullPrompt = chapter["fullPrompt"]?.ToString() ?? string.Empty
                });
            }
        }

        return new ChapterDraftResult
        {
            RawJson = rawJson,
            Chapters = chapters
        };
    }

    private async Task<string> SendPromptAsync(string prompt)
    {
        var requestBody = new
        {
            model = Model,
            messages = new[]
            {
                new { role = "system", content = "You are an educational content parser. Always return valid JSON." },
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" }
        };

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/chat/completions", requestBody);
        response.EnsureSuccessStatusCode();

        var jsonResponse = await response.Content.ReadAsStringAsync();
        var data = JObject.Parse(jsonResponse);
        var content = data["choices"]?[0]?["message"]?["content"]?.ToString();

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("Groq failed to generate content.");
        }

        return content;
    }
}
