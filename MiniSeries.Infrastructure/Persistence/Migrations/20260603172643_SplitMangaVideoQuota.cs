using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SplitMangaVideoQuota : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UsedGenerationCount",
                table: "UserProfiles",
                newName: "UsedMangaCount");

            migrationBuilder.RenameColumn(
                name: "MonthlyGenerationLimit",
                table: "UserProfiles",
                newName: "MangaMonthlyLimit");

            migrationBuilder.AddColumn<int>(
                name: "UsedVideoCount",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VideoMonthlyLimit",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql("""
                UPDATE "UserProfiles"
                SET
                    "MangaMonthlyLimit" = CASE
                        WHEN lower("PlanName") IN ('plus', 'basic') THEN 30
                        WHEN lower("PlanName") IN ('pro max', 'promax', 'premium') THEN 100
                        ELSE 3
                    END,
                    "VideoMonthlyLimit" = CASE
                        WHEN lower("PlanName") IN ('plus', 'basic') THEN 10
                        WHEN lower("PlanName") IN ('pro max', 'promax', 'premium') THEN 50
                        ELSE 1
                    END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsedVideoCount",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "VideoMonthlyLimit",
                table: "UserProfiles");

            migrationBuilder.RenameColumn(
                name: "UsedMangaCount",
                table: "UserProfiles",
                newName: "UsedGenerationCount");

            migrationBuilder.RenameColumn(
                name: "MangaMonthlyLimit",
                table: "UserProfiles",
                newName: "MonthlyGenerationLimit");
        }
    }
}
