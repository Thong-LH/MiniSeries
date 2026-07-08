using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAchievements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedStaffEmail",
                table: "SupportRequests",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "QuizAttempts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectedOption = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizAttempts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudentProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonId = table.Column<Guid>(type: "uuid", nullable: false),
                    LastReadChapterOrder = table.Column<int>(type: "integer", nullable: false),
                    ProgressPercentage = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProgresses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrafficLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrafficLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserAchievements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AchievementKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UnlockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAchievements", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_UserId_ChapterId",
                table: "QuizAttempts",
                columns: new[] { "UserId", "ChapterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentProgresses_UserId_LessonId",
                table: "StudentProgresses",
                columns: new[] { "UserId", "LessonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrafficLogs_CreatedAt",
                table: "TrafficLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_UserId_AchievementKey",
                table: "UserAchievements",
                columns: new[] { "UserId", "AchievementKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuizAttempts");

            migrationBuilder.DropTable(
                name: "StudentProgresses");

            migrationBuilder.DropTable(
                name: "TrafficLogs");

            migrationBuilder.DropTable(
                name: "UserAchievements");

            migrationBuilder.DropColumn(
                name: "AssignedStaffEmail",
                table: "SupportRequests");
        }
    }
}
