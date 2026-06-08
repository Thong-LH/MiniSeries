-- Chạy script này trong Supabase Dashboard → SQL Editor (một lần duy nhất).
-- Không cần dotnet ef database update.

CREATE TABLE IF NOT EXISTS "SupportRequests" (
    "Id" uuid PRIMARY KEY,
    "CustomerEmail" character varying(320) NOT NULL,
    "Content" text NOT NULL,
    "Reply" text NOT NULL DEFAULT '',
    "Status" character varying(50) NOT NULL DEFAULT 'Chờ trả lời',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Feedbacks" (
    "Id" uuid PRIMARY KEY,
    "Email" character varying(320) NOT NULL,
    "Rating" integer NOT NULL,
    "Comment" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "StaffReports" (
    "Id" uuid PRIMARY KEY,
    "StaffName" character varying(200) NOT NULL,
    "Content" text NOT NULL,
    "AdminReply" text NOT NULL DEFAULT '',
    "Status" character varying(50) NOT NULL DEFAULT 'Chờ duyệt',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_SupportRequests_CreatedAt" ON "SupportRequests" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Feedbacks_CreatedAt" ON "Feedbacks" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_StaffReports_CreatedAt" ON "StaffReports" ("CreatedAt");

-- Cho phép Anon Key (PostgREST) đọc/ghi — phù hợp môi trường dev/demo
ALTER TABLE "SupportRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffReports" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_support" ON "SupportRequests";
CREATE POLICY "anon_all_support" ON "SupportRequests" FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_feedback" ON "Feedbacks";
CREATE POLICY "anon_all_feedback" ON "Feedbacks" FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_report" ON "StaffReports";
CREATE POLICY "anon_all_report" ON "StaffReports" FOR ALL TO anon USING (true) WITH CHECK (true);

-- UserProfiles (đồng bộ Supabase Auth)
CREATE TABLE IF NOT EXISTS "UserProfiles" (
    "Id" uuid PRIMARY KEY,
    "Email" character varying(320) NOT NULL,
    "FullName" character varying(200) NOT NULL,
    "Role" character varying(50) NOT NULL DEFAULT 'Customer',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

-- Sửa bản ghi cũ thiếu CreatedAt (chạy an toàn nhiều lần)
UPDATE "UserProfiles" SET "CreatedAt" = now() WHERE "CreatedAt" IS NULL;
ALTER TABLE "UserProfiles" ALTER COLUMN "CreatedAt" SET DEFAULT now();
ALTER TABLE "UserProfiles" ALTER COLUMN "CreatedAt" SET NOT NULL;

ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_userprofiles" ON "UserProfiles";
CREATE POLICY "anon_all_userprofiles" ON "UserProfiles" FOR ALL TO anon USING (true) WITH CHECK (true);

-- PaymentHistory (SePay webhook)
CREATE TABLE IF NOT EXISTS "PaymentHistory" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserEmail" character varying(320) NOT NULL,
    "Amount" numeric(18,2) NOT NULL,
    "TransactionCode" character varying(50) NOT NULL,
    "Content" text NOT NULL DEFAULT '',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_PaymentHistory_CreatedAt" ON "PaymentHistory" ("CreatedAt");

ALTER TABLE "PaymentHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_paymenthistory" ON "PaymentHistory";
CREATE POLICY "anon_all_paymenthistory" ON "PaymentHistory" FOR ALL TO anon USING (true) WITH CHECK (true);
