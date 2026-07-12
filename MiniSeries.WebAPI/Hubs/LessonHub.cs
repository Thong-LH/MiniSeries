using Microsoft.AspNetCore.SignalR;

namespace MiniSeries.WebAPI.Hubs;

/// <summary>
/// SignalR hub for real-time lesson status updates.
/// Clients join a group named "lesson-{lessonId}" to receive updates.
/// This replaces the 2-second polling loop, eliminating thousands of
/// unnecessary database queries and drastically reducing Supabase egress.
/// </summary>
public class LessonHub : Hub
{
    /// <summary>Client calls this to subscribe to updates for a specific lesson.</summary>
    public async Task WatchLesson(string lessonId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"lesson-{lessonId}");
    }

    /// <summary>Alias for WatchLesson to match different client libraries.</summary>
    public async Task JoinLessonGroup(string lessonId)
    {
        await WatchLesson(lessonId);
    }

    /// <summary>Client calls this to unsubscribe from a lesson's updates.</summary>
    public async Task UnwatchLesson(string lessonId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"lesson-{lessonId}");
    }

    /// <summary>Alias for UnwatchLesson to match different client libraries.</summary>
    public async Task LeaveLessonGroup(string lessonId)
    {
        await UnwatchLesson(lessonId);
    }
}