using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Lessons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    RawContent = table.Column<string>(type: "text", nullable: false),
                    CreativeMode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreativeBrief = table.Column<string>(type: "text", nullable: true),
                    OutputMode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ScriptStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CharacterProfile = table.Column<string>(type: "text", nullable: false),
                    OverallScript = table.Column<string>(type: "text", nullable: false),
                    AnchorImageUrl = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lessons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chapters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonId = table.Column<Guid>(type: "uuid", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Summary = table.Column<string>(type: "text", nullable: false),
                    FullPrompt = table.Column<string>(type: "text", nullable: false),
                    VideoUrl = table.Column<string>(type: "text", nullable: true),
                    MangaUrl = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chapters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chapters_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GenerationJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CurrentStep = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GenerationJobs_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LlmJsons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonId = table.Column<Guid>(type: "uuid", nullable: false),
                    Purpose = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Provider = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    RawJson = table.Column<string>(type: "jsonb", nullable: false),
                    Feedback = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LlmJsons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LlmJsons_Lessons_LessonId",
                        column: x => x.LessonId,
                        principalTable: "Lessons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GenerationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GenerationJobId = table.Column<Guid>(type: "uuid", nullable: false),
                    Level = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Step = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GenerationLogs_GenerationJobs_GenerationJobId",
                        column: x => x.GenerationJobId,
                        principalTable: "GenerationJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chapters_LessonId_Order",
                table: "Chapters",
                columns: new[] { "LessonId", "Order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GenerationJobs_LessonId",
                table: "GenerationJobs",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_GenerationLogs_GenerationJobId",
                table: "GenerationLogs",
                column: "GenerationJobId");

            migrationBuilder.CreateIndex(
                name: "IX_LlmJsons_LessonId",
                table: "LlmJsons",
                column: "LessonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Chapters");

            migrationBuilder.DropTable(
                name: "GenerationLogs");

            migrationBuilder.DropTable(
                name: "LlmJsons");

            migrationBuilder.DropTable(
                name: "GenerationJobs");

            migrationBuilder.DropTable(
                name: "Lessons");
        }
    }
}
