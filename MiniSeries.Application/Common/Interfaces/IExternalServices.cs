using MiniSeries.Application.Common.Models;
using MiniSeries.Domain.Entities;

namespace MiniSeries.Application.Common.Interfaces;

public interface ILLMService
{
    Task<ScriptDraftResult> CreateScriptDraftAsync(string rawContent, string? creativeBrief);
    Task<ScriptDraftResult> ReviseScriptDraftAsync(
        string rawContent,
        string currentOverallScript,
        string feedback,
        string? creativeBrief);
    Task<ChapterDraftResult> CreateChaptersAsync(
        string rawContent,
        string approvedOverallScript,
        string characterProfile);
}

public interface IImageGenerationService
{
    Task<string> GenerateAnchorImageAsync(string characterProfile);
}

public interface IMangaService
{
    Task<string> GenerateMangaPageAsync(string anchorImageUrl, string fullPagePrompt);
}

public interface IVideoService
{
    Task<string> GenerateVideoClipAsync(string anchorImageUrl, string action);
}

public interface IStorageService
{
    Task<string> UploadAsync(string sourceUrl, string fileName);
}
