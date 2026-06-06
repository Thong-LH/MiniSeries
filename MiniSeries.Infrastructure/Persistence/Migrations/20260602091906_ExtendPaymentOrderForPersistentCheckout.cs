using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExtendPaymentOrderForPersistentCheckout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlanName",
                table: "PaymentOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "PaymentOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<string>(
                name: "UserEmail",
                table: "PaymentOrders",
                type: "character varying(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentOrders_PaymentCode",
                table: "PaymentOrders",
                column: "PaymentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentOrders_UserId",
                table: "PaymentOrders",
                column: "UserId");

            migrationBuilder.Sql("""
                UPDATE "PaymentOrders"
                SET "Status" = CASE WHEN "IsCompleted" THEN 'Paid' ELSE 'Pending' END
                WHERE "Status" = '' OR "Status" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PaymentOrders_PaymentCode",
                table: "PaymentOrders");

            migrationBuilder.DropIndex(
                name: "IX_PaymentOrders_UserId",
                table: "PaymentOrders");

            migrationBuilder.DropColumn(
                name: "PlanName",
                table: "PaymentOrders");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PaymentOrders");

            migrationBuilder.DropColumn(
                name: "UserEmail",
                table: "PaymentOrders");
        }
    }
}
