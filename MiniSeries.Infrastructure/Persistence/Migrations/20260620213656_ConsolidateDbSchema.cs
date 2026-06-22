using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniSeries.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateDbSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Drop the duplicate table "PaymentHistories" if it exists
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"PaymentHistories\";");

            // 2. Create "PaymentHistory" table if it doesn't exist
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""PaymentHistory"" (
                    ""Id"" uuid PRIMARY KEY,
                    ""UserEmail"" varchar(320) NOT NULL,
                    ""Amount"" numeric(18,2) NOT NULL,
                    ""TransactionCode"" varchar(50) NOT NULL,
                    ""Content"" text NOT NULL DEFAULT '',
                    ""CreatedAt"" timestamptz NOT NULL DEFAULT now()
                );
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_PaymentHistory_CreatedAt"" ON ""PaymentHistory"" (""CreatedAt"");
            ");

            // 3. Create "cskh_messages" table if it doesn't exist
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""cskh_messages"" (
                    id uuid PRIMARY KEY,
                    customer_email varchar(320) NOT NULL,
                    subject varchar(500) NOT NULL,
                    content text NOT NULL,
                    sender_role varchar(50) NOT NULL,
                    created_at timestamptz NOT NULL DEFAULT now()
                );
            ");

            // 4. Ensure "AccountStatus" and "TokenBalance" exist in "UserProfiles"
            migrationBuilder.Sql(@"
                ALTER TABLE ""UserProfiles"" ADD COLUMN IF NOT EXISTS ""AccountStatus"" varchar(50) NOT NULL DEFAULT 'Active';
                ALTER TABLE ""UserProfiles"" ADD COLUMN IF NOT EXISTS ""TokenBalance"" integer NOT NULL DEFAULT 0;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"cskh_messages\";");
        }
    }
}
