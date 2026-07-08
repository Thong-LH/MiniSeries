using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;
using MiniSeries.Infrastructure.Persistence;
using MiniSeries.WebAPI.Security;

namespace MiniSeries.WebAPI.Controllers
{
    public sealed record UpdateProgressRequest(Guid LessonId, int LastReadChapterOrder, int TotalChapters);
    public sealed record LogQuizAttemptRequest(Guid ChapterId, string SelectedOption, bool IsCorrect);

    [ApiController]
    [Authorize(Policy = "AuthenticatedUser")]
    [Route("api/progress")]
    public sealed class ProgressController(MiniSeriesDbContext dbContext) : ControllerBase
    {
        [HttpPost("update")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateProgressRequest request)
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            if (request.TotalChapters <= 0)
            {
                return BadRequest(new { message = "Total chapters must be greater than zero." });
            }

            var lessonExists = await dbContext.Lessons.AnyAsync(l => l.Id == request.LessonId);
            if (!lessonExists)
            {
                return NotFound(new { message = "Lesson not found." });
            }

            var progress = await dbContext.StudentProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId.Value && p.LessonId == request.LessonId);

            int progressPercentage = (request.LastReadChapterOrder * 100) / request.TotalChapters;
            if (progressPercentage > 100) progressPercentage = 100;
            if (progressPercentage < 0) progressPercentage = 0;

            if (progress == null)
            {
                progress = new StudentProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = userId.Value,
                    LessonId = request.LessonId,
                    LastReadChapterOrder = request.LastReadChapterOrder,
                    ProgressPercentage = progressPercentage,
                    UpdatedAt = DateTime.UtcNow
                };
                dbContext.StudentProgresses.Add(progress);
            }
            else
            {
                // Only advance progress, don't downgrade it unless overall script changed
                if (request.LastReadChapterOrder > progress.LastReadChapterOrder || progressPercentage > progress.ProgressPercentage)
                {
                    progress.LastReadChapterOrder = request.LastReadChapterOrder;
                    progress.ProgressPercentage = progressPercentage;
                }
                progress.UpdatedAt = DateTime.UtcNow;
                dbContext.StudentProgresses.Update(progress);
            }

            await dbContext.SaveChangesAsync();
            return Ok(progress);
        }

        [HttpPost("quiz-attempt")]
        public async Task<IActionResult> LogQuizAttempt([FromBody] LogQuizAttemptRequest request)
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            var chapterExists = await dbContext.Chapters.AnyAsync(c => c.Id == request.ChapterId);
            if (!chapterExists)
            {
                return NotFound(new { message = "Chapter not found." });
            }

            var attempt = await dbContext.QuizAttempts
                .FirstOrDefaultAsync(a => a.UserId == userId.Value && a.ChapterId == request.ChapterId);

            if (attempt == null)
            {
                attempt = new QuizAttempt
                {
                    Id = Guid.NewGuid(),
                    UserId = userId.Value,
                    ChapterId = request.ChapterId,
                    SelectedOption = request.SelectedOption,
                    IsCorrect = request.IsCorrect,
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.QuizAttempts.Add(attempt);
            }
            else
            {
                // Update selected answer and status
                attempt.SelectedOption = request.SelectedOption;
                attempt.IsCorrect = request.IsCorrect;
                attempt.CreatedAt = DateTime.UtcNow;
                dbContext.QuizAttempts.Update(attempt);
            }

            await dbContext.SaveChangesAsync();
            return Ok(attempt);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyProgress()
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            var lessons = await dbContext.Lessons
                .Where(l => l.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            var progresses = await dbContext.StudentProgresses
                .Where(p => p.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            var chapters = await dbContext.Chapters
                .Where(c => dbContext.Lessons.Any(l => l.UserId == userId.Value && l.Id == c.LessonId))
                .AsNoTracking()
                .ToListAsync();

            var attempts = await dbContext.QuizAttempts
                .Where(a => a.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            var result = lessons.Select(lesson =>
            {
                var progress = progresses.FirstOrDefault(p => p.LessonId == lesson.Id);
                var lessonChapters = chapters.Where(c => c.LessonId == lesson.Id).ToList();
                int totalChaptersCount = lessonChapters.Count;

                // Calculate completed quiz attempts for this lesson
                int completedQuizzesCount = attempts.Count(a => 
                    a.IsCorrect && 
                    lessonChapters.Any(lc => lc.Id == a.ChapterId)
                );

                return new
                {
                    LessonId = lesson.Id,
                    LessonTitle = lesson.Title,
                    OutputMode = lesson.OutputMode.ToString(),
                    LastReadChapterOrder = progress?.LastReadChapterOrder ?? 0,
                    ProgressPercentage = progress?.ProgressPercentage ?? 0,
                    UpdatedAt = progress?.UpdatedAt ?? lesson.CreatedAt,
                    TotalChapters = totalChaptersCount,
                    CompletedQuizzes = completedQuizzesCount
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("my-quiz-attempts")]
        public async Task<IActionResult> GetMyQuizAttempts()
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            var attempts = await dbContext.QuizAttempts
                .Where(a => a.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            return Ok(attempts);
        }

        private sealed record UserStats(
            int CurrentStreak,
            int LongestStreak,
            int TotalStudyMinutes,
            int CompletedLessons,
            int CorrectQuizzes,
            int TotalLessons,
            int TotalExp,
            int CurrentLevel,
            string LevelLabel,
            int NextLevelExp,
            int PrevLevelExp
        );

        private async Task<UserStats> CalculateUserStatsAsync(Guid userId)
        {
            var progresses = await dbContext.StudentProgresses
                .Where(p => p.UserId == userId)
                .AsNoTracking()
                .ToListAsync();

            var lessons = await dbContext.Lessons
                .Where(l => l.UserId == userId)
                .AsNoTracking()
                .ToListAsync();

            var correctQuizzes = await dbContext.QuizAttempts
                .Where(q => q.UserId == userId && q.IsCorrect)
                .CountAsync();

            var activityDates = progresses.Select(p => p.UpdatedAt.Date)
                .Concat(lessons.Select(l => l.CreatedAt.Date))
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            int currentStreak = 0;
            var today = DateTime.UtcNow.Date;
            var checkDate = today;

            if (!activityDates.Contains(today))
            {
                checkDate = today.AddDays(-1);
            }

            while (activityDates.Contains(checkDate))
            {
                currentStreak++;
                checkDate = checkDate.AddDays(-1);
            }

            int longestStreak = 0;
            int tempStreak = 0;
            if (activityDates.Count > 0)
            {
                var sortedDates = activityDates.OrderBy(d => d).ToList();
                for (int i = 0; i < sortedDates.Count; i++)
                {
                    if (i == 0)
                    {
                        tempStreak = 1;
                    }
                    else
                    {
                        var diff = (sortedDates[i] - sortedDates[i - 1]).Days;
                        if (diff == 1)
                        {
                            tempStreak++;
                        }
                        else if (diff > 1)
                        {
                            if (tempStreak > longestStreak) longestStreak = tempStreak;
                            tempStreak = 1;
                        }
                    }
                }
                if (tempStreak > longestStreak) longestStreak = tempStreak;
            }

            int totalChaptersRead = progresses.Sum(p => p.LastReadChapterOrder);
            int totalStudyMinutes = totalChaptersRead * 10 + lessons.Count * 15;
            int completedLessons = progresses.Count(p => p.ProgressPercentage == 100);

            // Compute EXP
            int totalExp = (lessons.Count * 15) + (totalChaptersRead * 10) + (correctQuizzes * 20) + (completedLessons * 50) + (longestStreak * 30);

            int currentLevel = 1;
            string levelLabel = "Tập sự";
            int prevLevelExp = 0;
            int nextLevelExp = 100;

            if (totalExp >= 1500)
            {
                currentLevel = 5;
                levelLabel = "Bác sĩ lạ";
                prevLevelExp = 1500;
                nextLevelExp = 1500;
            }
            else if (totalExp >= 700)
            {
                currentLevel = 4;
                levelLabel = "Trí tuệ";
                prevLevelExp = 700;
                nextLevelExp = 1500;
            }
            else if (totalExp >= 300)
            {
                currentLevel = 3;
                levelLabel = "Học giả";
                prevLevelExp = 300;
                nextLevelExp = 700;
            }
            else if (totalExp >= 100)
            {
                currentLevel = 2;
                levelLabel = "Mới bắt đầu";
                prevLevelExp = 100;
                nextLevelExp = 300;
            }

            return new UserStats(
                currentStreak,
                longestStreak,
                totalStudyMinutes,
                completedLessons,
                correctQuizzes,
                lessons.Count,
                totalExp,
                currentLevel,
                levelLabel,
                nextLevelExp,
                prevLevelExp
            );
        }

        private async Task EvaluateAndUnlockAchievementsAsync(Guid userId, UserStats stats)
        {
            var unlockedKeys = await dbContext.UserAchievements
                .Where(a => a.UserId == userId)
                .Select(a => a.AchievementKey)
                .ToListAsync();

            var newAchievements = new List<UserAchievement>();

            void CheckAndAdd(string key, bool condition)
            {
                if (condition && !unlockedKeys.Contains(key))
                {
                    newAchievements.Add(new UserAchievement
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AchievementKey = key,
                        UnlockedAt = DateTime.UtcNow
                    });
                }
            }

            CheckAndAdd("streak_3", stats.CurrentStreak >= 3);
            CheckAndAdd("streak_7", stats.CurrentStreak >= 7);
            CheckAndAdd("streak_30", stats.CurrentStreak >= 30);

            CheckAndAdd("lessons_1", stats.CompletedLessons >= 1);
            CheckAndAdd("lessons_5", stats.CompletedLessons >= 5);
            CheckAndAdd("lessons_15", stats.CompletedLessons >= 15);

            CheckAndAdd("minutes_60", stats.TotalStudyMinutes >= 60);
            CheckAndAdd("minutes_300", stats.TotalStudyMinutes >= 300);
            CheckAndAdd("minutes_1200", stats.TotalStudyMinutes >= 1200);

            CheckAndAdd("quiz_1", stats.CorrectQuizzes >= 1);
            CheckAndAdd("quiz_10", stats.CorrectQuizzes >= 10);

            CheckAndAdd("level_3", stats.CurrentLevel >= 3);
            CheckAndAdd("level_5", stats.CurrentLevel >= 5);
            CheckAndAdd("exp_500", stats.TotalExp >= 500);
            CheckAndAdd("exp_2000", stats.TotalExp >= 2000);

            if (newAchievements.Count > 0)
            {
                await dbContext.UserAchievements.AddRangeAsync(newAchievements);
                await dbContext.SaveChangesAsync();
            }
        }

        private sealed record AchievementDefinition(
            string Key,
            string Name,
            string Description,
            string Category,
            string Icon,
            int TargetProgress
        );

        private static readonly AchievementDefinition[] Achievements = new[]
        {
            new AchievementDefinition("streak_3", "Chiến binh Chăm chỉ", "Học tập liên tiếp 3 ngày", "Streak", "flame", 3),
            new AchievementDefinition("streak_7", "Thói quen Vàng", "Học tập liên tiếp 7 ngày", "Streak", "trophy", 7),
            new AchievementDefinition("streak_30", "Học giả Kiên trì", "Học tập liên tiếp 30 ngày", "Streak", "calendar", 30),

            new AchievementDefinition("lessons_1", "Khởi đầu Thuận lợi", "Hoàn thành 1 bài học 100% tiến độ", "Lessons", "play-circle", 1),
            new AchievementDefinition("lessons_5", "Mọt Sách", "Hoàn thành 5 bài học", "Lessons", "book-open", 5),
            new AchievementDefinition("lessons_15", "Thông thái", "Hoàn thành 15 bài học", "Lessons", "ribbon", 15),

            new AchievementDefinition("minutes_60", "Tập trung Cao độ", "Đạt 60 phút học tập", "Minutes", "time", 60),
            new AchievementDefinition("minutes_300", "Nỗ lực Bền bỉ", "Đạt 300 phút học tập", "Minutes", "hourglass", 300),
            new AchievementDefinition("minutes_1200", "Bác sĩ lạ", "Làm chủ dòng chảy thời gian với 1200 phút học tập", "Minutes", "medal", 1200),

            new AchievementDefinition("quiz_1", "Đúng tuyệt đối", "Trả lời đúng câu hỏi trắc nghiệm đầu tiên", "Quiz", "checkmark-circle", 1),
            new AchievementDefinition("quiz_10", "Vua Trắc nghiệm", "Trả lời đúng 10 câu hỏi trắc nghiệm", "Quiz", "sparkles", 10),

            new AchievementDefinition("level_3", "Học giả Trí tuệ", "Đạt Cấp 3", "Level", "star", 3),
            new AchievementDefinition("level_5", "Huyền thoại Hiền triết", "Đạt Cấp 5", "Level", "ribbon", 5),
            new AchievementDefinition("exp_500", "Tích tiểu thành đại", "Đạt tích lũy 500 EXP", "EXP", "wallet", 500),
            new AchievementDefinition("exp_2000", "Nhà tài phiệt tri thức", "Đạt tích lũy 2000 EXP", "EXP", "gem", 2000)
        };

        [HttpGet("achievements")]
        public async Task<IActionResult> GetAchievements()
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            var stats = await CalculateUserStatsAsync(userId.Value);
            await EvaluateAndUnlockAchievementsAsync(userId.Value, stats);

            var unlocked = await dbContext.UserAchievements
                .Where(a => a.UserId == userId.Value)
                .ToDictionaryAsync(a => a.AchievementKey, a => a.UnlockedAt);

            var result = Achievements.Select(def =>
            {
                bool isUnlocked = unlocked.ContainsKey(def.Key);
                DateTime? unlockedAt = isUnlocked ? unlocked[def.Key] : null;

                int currentProgress = def.Key switch
                {
                    var k when k.StartsWith("streak") => stats.CurrentStreak,
                    var k when k.StartsWith("lessons") => stats.CompletedLessons,
                    var k when k.StartsWith("minutes") => stats.TotalStudyMinutes,
                    var k when k.StartsWith("quiz") => stats.CorrectQuizzes,
                    var k when k.StartsWith("level") => stats.CurrentLevel,
                    var k when k.StartsWith("exp") => stats.TotalExp,
                    _ => 0
                };

                return new
                {
                    Key = def.Key,
                    Name = def.Name,
                    Description = def.Description,
                    Category = def.Category,
                    Icon = def.Icon,
                    IsUnlocked = isUnlocked,
                    UnlockedAt = unlockedAt,
                    CurrentProgress = Math.Min(currentProgress, def.TargetProgress),
                    TargetProgress = def.TargetProgress
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var userId = AuthUser.GetCurrentUserId(User);
            if (userId is null) return Unauthorized();

            var stats = await CalculateUserStatsAsync(userId.Value);
            await EvaluateAndUnlockAchievementsAsync(userId.Value, stats);

            var progresses = await dbContext.StudentProgresses
                .Where(p => p.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            var lessons = await dbContext.Lessons
                .Where(l => l.UserId == userId.Value)
                .AsNoTracking()
                .ToListAsync();

            var activityDates = progresses.Select(p => p.UpdatedAt.Date)
                .Concat(lessons.Select(l => l.CreatedAt.Date))
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            var now = DateTime.UtcNow;
            int diffToMon = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
            var startOfWeek = now.Date.AddDays(-diffToMon);

            var weeklyActivity = Enumerable.Range(0, 7).Select(i =>
            {
                var dayDate = startOfWeek.AddDays(i);
                string dayLabel = dayDate.DayOfWeek switch
                {
                    DayOfWeek.Monday => "T2",
                    DayOfWeek.Tuesday => "T3",
                    DayOfWeek.Wednesday => "T4",
                    DayOfWeek.Thursday => "T5",
                    DayOfWeek.Friday => "T6",
                    DayOfWeek.Saturday => "T7",
                    DayOfWeek.Sunday => "CN",
                    _ => ""
                };

                int activityCount = lessons.Count(l => l.CreatedAt.Date == dayDate) + progresses.Count(p => p.UpdatedAt.Date == dayDate);

                return new
                {
                    DayLabel = dayLabel,
                    DateStr = dayDate.ToString("yyyy-MM-dd"),
                    IsActive = activityDates.Contains(dayDate),
                    ActivityCount = activityCount
                };
            }).ToList();

            int mangaCount = lessons.Count(l => l.OutputMode == Domain.Enums.OutputMode.Manga);
            int videoCount = lessons.Count(l => l.OutputMode == Domain.Enums.OutputMode.Video);

            return Ok(new
            {
                CurrentStreak = stats.CurrentStreak,
                LongestStreak = stats.LongestStreak,
                WeeklyActivity = weeklyActivity,
                TotalStudyMinutes = stats.TotalStudyMinutes,
                CompletedLessons = stats.CompletedLessons,
                MangaCount = mangaCount,
                VideoCount = videoCount,
                TotalLessons = stats.TotalLessons,
                TotalExp = stats.TotalExp,
                CurrentLevel = stats.CurrentLevel,
                LevelLabel = stats.LevelLabel,
                NextLevelExp = stats.NextLevelExp,
                PrevLevelExp = stats.PrevLevelExp
            });
        }
    }
}
