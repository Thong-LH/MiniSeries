using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserGenerationQuota : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "UserProfiles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "UserProfiles",
                type: "character varying(320)",
                maxLength: 320,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "CurrentPeriodEnd",
                table: "UserProfiles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW() + INTERVAL '1 month'");

            migrationBuilder.AddColumn<DateTime>(
                name: "CurrentPeriodStart",
                table: "UserProfiles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");

            migrationBuilder.AddColumn<int>(
                name: "MonthlyGenerationLimit",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<string>(
                name: "PlanName",
                table: "UserProfiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Free");

            migrationBuilder.AddColumn<int>(
                name: "UsedGenerationCount",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentPeriodEnd",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "CurrentPeriodStart",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "MonthlyGenerationLimit",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "PlanName",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "UsedGenerationCount",
                table: "UserProfiles");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "FullName",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "UserProfiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(320)",
                oldMaxLength: 320);
        }
    }
}
