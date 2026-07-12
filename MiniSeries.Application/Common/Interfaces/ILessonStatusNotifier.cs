namespace MiniSeries.Application.Common.Interfaces;

/// <summary>
/// Pushes real-time lesson status changes to connected clients (SignalR).
/// Replaces the old polling mechanism to drastically reduce Supabase egress.
/// </summary>
public interface ILessonStatusNotifier
{
    /// <summary>Notify all clients watching a lesson that its status has changed.</summary>
    Task NotifyLessonStatusChangedAsync(Guid lessonId, string status, string? message = null);

    /// <summary>Notify that a specific chapter's media has been generated.</summary>
    Task NotifyChapterMediaReadyAsync(Guid lessonId, Guid chapterId, int chapterOrder);

    /// <summary>Notify that the entire media generation job completed or failed.</summary>
    Task NotifyJobCompletedAsync(Guid lessonId, bool success, string? errorMessage = null);
}