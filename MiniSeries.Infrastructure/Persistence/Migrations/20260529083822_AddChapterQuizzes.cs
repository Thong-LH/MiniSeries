using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterQuizzes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChapterQuizzes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChapterId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "text", nullable: false),
                    OptionA = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OptionB = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OptionC = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OptionD = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CorrectOption = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChapterQuizzes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChapterQuizzes_Chapters_ChapterId",
                        column: x => x.ChapterId,
                        principalTable: "Chapters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChapterQuizzes_ChapterId",
                table: "ChapterQuizzes",
                column: "ChapterId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChapterQuizzes");
        }
    }
}
