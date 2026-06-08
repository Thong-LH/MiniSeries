using Microsoft.EntityFrameworkCore;
using MiniSeries.Domain.Entities;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class MiniSeriesDbContext(DbContextOptions<MiniSeriesDbContext> options) : DbContext(options)
{
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<ChapterQuiz> ChapterQuizzes => Set<ChapterQuiz>();
    public DbSet<LlmJson> LlmJsons => Set<LlmJson>();
    public DbSet<GenerationJob> GenerationJobs => Set<GenerationJob>();
    public DbSet<GenerationLog> GenerationLogs => Set<GenerationLog>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<PaymentOrder> PaymentOrders => Set<PaymentOrder>();
    public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<StaffReport> StaffReports => Set<StaffReport>();
    public DbSet<PaymentHistory> PaymentHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserEmail).HasMaxLength(320);
            entity.Property(x => x.Title).HasMaxLength(300);
            entity.Property(x => x.RawContent).HasColumnType("text");
            entity.Property(x => x.CreativeBrief).HasColumnType("text");
            entity.Property(x => x.CharacterProfile).HasColumnType("text");
            entity.Property(x => x.OverallScript).HasColumnType("text");
            entity.Property(x => x.AnchorImageUrl).HasColumnType("text");
            entity.Property(x => x.CreativeMode).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.OutputMode).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.ScriptStatus).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(x => x.UserId);

            entity.HasMany(x => x.Chapters)
                .WithOne()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.LlmJsons)
                .WithOne()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.GenerationJobs)
                .WithOne()
                .HasForeignKey(x => x.LessonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Chapter>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Summary).HasColumnType("text");
            entity.Property(x => x.FullPrompt).HasColumnType("text");
            entity.Property(x => x.MangaUrl).HasColumnType("text");
            entity.Property(x => x.VideoUrl).HasColumnType("text");
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(x => new { x.LessonId, x.Order }).IsUnique();

            entity.HasOne(x => x.Quiz)
                .WithOne()
                .HasForeignKey<ChapterQuiz>(x => x.ChapterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChapterQuiz>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Question).HasColumnType("text");
            entity.Property(x => x.OptionA).HasMaxLength(500);
            entity.Property(x => x.OptionB).HasMaxLength(500);
            entity.Property(x => x.OptionC).HasMaxLength(500);
            entity.Property(x => x.OptionD).HasMaxLength(500);
            entity.Property(x => x.CorrectOption).HasMaxLength(1);
            entity.Property(x => x.Explanation).HasColumnType("text");
            entity.HasIndex(x => x.ChapterId).IsUnique();
        });

        modelBuilder.Entity<LlmJson>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Purpose).HasConversion<string>().HasMaxLength(64);
            entity.Property(x => x.Provider).HasMaxLength(80);
            entity.Property(x => x.Model).HasMaxLength(120);
            entity.Property(x => x.RawJson).HasColumnType("jsonb");
            entity.Property(x => x.Feedback).HasColumnType("text");
        });

        modelBuilder.Entity<GenerationJob>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasConversion<string>().HasMaxLength(64);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(64);
            entity.Property(x => x.CurrentStep).HasMaxLength(120);
            entity.Property(x => x.ErrorMessage).HasColumnType("text");

            entity.HasMany(x => x.Logs)
                .WithOne()
                .HasForeignKey(x => x.GenerationJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GenerationLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Level).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Step).HasMaxLength(120);
            entity.Property(x => x.Message).HasColumnType("text");
            entity.Property(x => x.PayloadJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<PaymentOrder>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserId).HasMaxLength(100);
            entity.Property(x => x.UserEmail).HasMaxLength(320);
            entity.Property(x => x.PlanName).HasMaxLength(100);
            entity.Property(x => x.PaymentCode).HasMaxLength(50);
            entity.Property(x => x.MoneyAmount).HasColumnType("decimal(18,2)");
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => x.PaymentCode).IsUnique();
            entity.HasIndex(x => x.UserId);
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.Property(x => x.FullName).HasMaxLength(200);
            entity.Property(x => x.Role).HasMaxLength(50);
            entity.Property(x => x.PlanName).HasMaxLength(50).HasDefaultValue("Free");
            entity.Property(x => x.MangaMonthlyLimit).HasDefaultValue(3);
            entity.Property(x => x.UsedMangaCount).HasDefaultValue(0);
            entity.Property(x => x.VideoMonthlyLimit).HasDefaultValue(1);
            entity.Property(x => x.UsedVideoCount).HasDefaultValue(0);
            entity.Property(x => x.CurrentPeriodStart).HasDefaultValueSql("NOW()");
            entity.Property(x => x.CurrentPeriodEnd).HasDefaultValueSql("NOW() + INTERVAL '1 month'");
        });

        modelBuilder.Entity<SupportRequest>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CustomerEmail).HasMaxLength(320);
            entity.Property(x => x.Content).HasColumnType("text");
            entity.Property(x => x.Reply).HasColumnType("text");
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.Property(x => x.Comment).HasColumnType("text");
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<StaffReport>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.StaffName).HasMaxLength(200);
            entity.Property(x => x.Content).HasColumnType("text");
            entity.Property(x => x.AdminReply).HasColumnType("text");
            entity.Property(x => x.Status).HasMaxLength(50);
            entity.HasIndex(x => x.CreatedAt);
        });
    }
}
