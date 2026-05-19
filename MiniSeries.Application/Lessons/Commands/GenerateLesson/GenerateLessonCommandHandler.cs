using MiniSeries.Application.Common.Interfaces;
using MiniSeries.Domain.Entities;
using MiniSeries.Domain.Enums;
using MediatR;

namespace MiniSeries.Application.Lessons.Commands.GenerateLesson;

public record GenerateLessonCommand(string RawContent, string Title, bool GenerateVideo) : IRequest<Lesson>;

public class GenerateLessonCommandHandler(
    ILLMService llmService,
    IImageGenerationService imageGenerationService,
    IMangaService mangaService,
    IVideoService videoService,
    IStorageService storageService,
    ILessonStore lessonStore)
    : IRequestHandler<GenerateLessonCommand, Lesson>
{
    public async Task<Lesson> Handle(GenerateLessonCommand request, CancellationToken cancellationToken)
    {
        var lesson = new Lesson
        {
            Title = request.Title,
            RawContent = request.RawContent,
            OutputMode = request.GenerateVideo ? OutputMode.Video : OutputMode.Manga,
            ScriptStatus = ScriptStatus.Approved,
            ApprovedAt = DateTime.UtcNow
        };

        var draft = await llmService.CreateScriptDraftAsync(request.RawContent, null);
        lesson.CharacterProfile = draft.CharacterProfile;
        lesson.OverallScript = draft.OverallScript;
        lesson.LlmJsons.Add(new LlmJson
        {
            LessonId = lesson.Id,
            Purpose = LlmJsonPurpose.ScriptDraft,
            Provider = "Groq",
            Model = "llama-3.3-70b-versatile",
            RawJson = draft.RawJson
        });

        var chapterDraft = await llmService.CreateChaptersAsync(
            request.RawContent,
            lesson.OverallScript,
            lesson.CharacterProfile);

        lesson.LlmJsons.Add(new LlmJson
        {
            LessonId = lesson.Id,
            Purpose = LlmJsonPurpose.ChapterGeneration,
            Provider = "Groq",
            Model = "llama-3.3-70b-versatile",
            RawJson = chapterDraft.RawJson
        });

        lesson.Chapters = chapterDraft.Chapters.Select(ch => new Chapter
        {
            LessonId = lesson.Id,
            Order = ch.Order,
            Summary = ch.Summary,
            FullPrompt = ch.FullPrompt,
            Status = ChapterStatus.ReadyForGeneration
        }).ToList();

        var anchorLocalUrl = await imageGenerationService.GenerateAnchorImageAsync(lesson.CharacterProfile);
        lesson.AnchorImageUrl = await storageService.UploadAsync(anchorLocalUrl, $"anchor_{lesson.Id}");

        foreach (var chapter in lesson.Chapters)
        {
            if (lesson.OutputMode == OutputMode.Video)
            {
                var videoUrl = await videoService.GenerateVideoClipAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                chapter.VideoUrl = await storageService.UploadAsync(videoUrl, $"chapter_vid_{chapter.Id}");
            }
            else
            {
                var mangaPageUrl = await mangaService.GenerateMangaPageAsync(lesson.AnchorImageUrl, chapter.FullPrompt);
                chapter.MangaUrl = await storageService.UploadAsync(mangaPageUrl, $"chapter_{chapter.Order}_{lesson.Id}");
            }

            chapter.Status = ChapterStatus.Generated;
        }

        lesson.UpdatedAt = DateTime.UtcNow;
        await lessonStore.SaveAsync(lesson);
        return lesson;
    }
}
