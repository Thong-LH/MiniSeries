using System.Net.Http.Json;
using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Application.Common.Models;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace MiniSeries.Infrastructure.ExternalServices;

public class GeminiService : ILLMService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GeminiService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? "YOUR_GEMINI_API_KEY";
    }

    public Task<ScriptDraftResult> CreateScriptDraftAsync(string rawContent, string? creativeBrief)
        => SendScriptPromptAsync(rawContent, creativeBrief, null, null);

    public Task<ScriptDraftResult> ReviseScriptDraftAsync(
        string rawContent,
        string currentOverallScript,
        string feedback,
        string? creativeBrief)
        => SendScriptPromptAsync(rawContent, creativeBrief, currentOverallScript, feedback);

    public async Task<ChapterDraftResult> CreateChaptersAsync(
        string rawContent,
        string approvedOverallScript,
        string characterProfile)
    {
        var prompt = $@"
        Using the approved overall script below, break the lesson into 3 to 4 manga chapters/pages.
        Also create ONE short interactive quiz question at the end of each chapter.
        Return ONLY valid JSON with this shape:
        {{
            ""chapters"": [
                {{
                    ""chapterNumber"": 1,
                    ""summary"": ""Brief summary of the chapter."",
                    ""fullPrompt"": ""Detailed prompt for one final manga page."",
                    ""quiz"": {{
                        ""question"": ""A short question about the chapter content."",
                        ""optionA"": ""First answer option."",
                        ""optionB"": ""Second answer option."",
                        ""optionC"": ""Third answer option."",
                        ""optionD"": ""Fourth answer option."",
                        ""correctOption"": ""A"",
                        ""explanation"": ""Short explanation.""
                    }}
                }}
            ]
        }}

        Lesson content:
        {rawContent}

        Approved overall script:
        {approvedOverallScript}

        Character profile:
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
                    FullPrompt = chapter["fullPrompt"]?.ToString() ?? string.Empty,
                    Quiz = ParseQuiz(chapter["quiz"])
                });
            }
        }

        return new ChapterDraftResult
        {
            RawJson = rawJson,
            Chapters = chapters
        };
    }

    private static ChapterQuizDraftItem ParseQuiz(JToken? quiz)
    {
        var correctOption = quiz?["correctOption"]?.ToString().Trim().ToUpperInvariant();
        if (correctOption is not ("A" or "B" or "C" or "D"))
        {
            correctOption = "A";
        }

        return new ChapterQuizDraftItem
        {
            Question = quiz?["question"]?.ToString() ?? string.Empty,
            OptionA = quiz?["optionA"]?.ToString() ?? string.Empty,
            OptionB = quiz?["optionB"]?.ToString() ?? string.Empty,
            OptionC = quiz?["optionC"]?.ToString() ?? string.Empty,
            OptionD = quiz?["optionD"]?.ToString() ?? string.Empty,
            CorrectOption = correctOption,
            Explanation = quiz?["explanation"]?.ToString() ?? string.Empty
        };
    }

    private async Task<ScriptDraftResult> SendScriptPromptAsync(
        string rawContent,
        string? creativeBrief,
        string? currentOverallScript,
        string? feedback)
    {
        var revisionBlock = string.IsNullOrWhiteSpace(currentOverallScript)
            ? string.Empty
            : $@"
        Current overall script:
        {currentOverallScript}

        User feedback:
        {feedback}";

        var prompt = $@"
        Create or revise a high-level educational story script.
        Do NOT split it into chapters yet.
        Return ONLY valid JSON with this shape:
        {{
            ""characterProfile"": ""Detailed visual description of the recurring main character."",
            ""overallScript"": ""A coherent overall script/treatment.""
        }}

        Creative brief:
        {creativeBrief}

        Lesson content:
        {rawContent}
        {revisionBlock}";

        var rawJson = await SendPromptAsync(prompt);
        var parsed = JObject.Parse(rawJson);

        return new ScriptDraftResult
        {
            RawJson = rawJson,
            CharacterProfile = parsed["characterProfile"]?.ToString() ?? string.Empty,
            OverallScript = parsed["overallScript"]?.ToString() ?? string.Empty
        };
    }

    private async Task<string> SendPromptAsync(string prompt)
    {
        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json"
            }
        };

        var response = await _httpClient.PostAsJsonAsync(
            $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={_apiKey}",
            requestBody);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JObject>();
        var contentText = result?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString();

        if (string.IsNullOrWhiteSpace(contentText))
        {
            throw new InvalidOperationException("Gemini failed to generate content.");
        }

        return contentText;
    }
}
