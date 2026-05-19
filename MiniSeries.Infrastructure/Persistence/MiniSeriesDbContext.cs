using MiniSeries.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MiniSeries.Infrastructure.Persistence;

public sealed class MiniSeriesDbContext(DbContextOptions<MiniSeriesDbContext> options) : DbContext(options)
{
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<LlmJson> LlmJsons => Set<LlmJson>();
    public DbSet<GenerationJob> GenerationJobs => Set<GenerationJob>();
    public DbSet<GenerationLog> GenerationLogs => Set<GenerationLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(300);
            entity.Property(x => x.RawContent).HasColumnType("text");
            entity.Property(x => x.CreativeBrief).HasColumnType("text");
            entity.Property(x => x.CharacterProfile).HasColumnType("text");
            entity.Property(x => x.OverallScript).HasColumnType("text");
            entity.Property(x => x.AnchorImageUrl).HasColumnType("text");
            entity.Property(x => x.CreativeMode).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.OutputMode).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.ScriptStatus).HasConversion<string>().HasMaxLength(32);

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
    }
}
