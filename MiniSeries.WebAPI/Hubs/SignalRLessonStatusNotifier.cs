using Microsoft.AspNetCore.SignalR;
using MiniSeries.Application.Common.Interfaces;

namespace MiniSeries.WebAPI.Hubs;

/// <summary>
/// Sends real-time lesson status updates to connected clients via SignalR.
/// This eliminates the need for 2-second polling loops that were causing
/// massive Supabase egress (up to 90 MB/hour per client).
/// </summary>
public class SignalRLessonStatusNotifier : ILessonStatusNotifier
{
    private readonly IHubContext<LessonHub> _hub;

    public SignalRLessonStatusNotifier(IHubContext<LessonHub> hub)
    {
        _hub = hub;
    }

    public async Task NotifyLessonStatusChangedAsync(Guid lessonId, string status, string? message = null)
    {
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("LessonStatusChanged", new { lessonId, status, message });
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("StatusChanged", new { lessonId, status, errorMessage = message });
    }

    public async Task NotifyChapterMediaReadyAsync(Guid lessonId, Guid chapterId, int chapterOrder)
    {
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("ChapterMediaReady", new { lessonId, chapterId, chapterOrder });
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("StatusChanged", new { lessonId, status = "ChapterReady", chapterId, chapterOrder });
    }

    public async Task NotifyJobCompletedAsync(Guid lessonId, bool success, string? errorMessage = null)
    {
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("JobCompleted", new { lessonId, success, errorMessage });
        await _hub.Clients.Group($"lesson-{lessonId}")
            .SendAsync("StatusChanged", new { lessonId, status = success ? "Completed" : "Failed", errorMessage });
    }
}