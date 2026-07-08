-- Chạy script này trong Supabase Dashboard → SQL Editor (một lần duy nhất).
-- Không cần dotnet ef database update.

CREATE TABLE IF NOT EXISTS "SupportRequests" (
    "Id" uuid PRIMARY KEY,
    "CustomerEmail" character varying(320) NOT NULL,
    "Content" text NOT NULL,
    "Reply" text NOT NULL DEFAULT '',
    "Status" character varying(50) NOT NULL DEFAULT 'Chờ trả lời',
    "AssignedStaffEmail" character varying(320),
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "SupportRequests" ADD COLUMN IF NOT EXISTS "AssignedStaffEmail" character varying(320);

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

ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_userprofiles" ON "UserProfiles";
CREATE POLICY "anon_all_userprofiles" ON "UserProfiles" FOR ALL TO anon USING (true) WITH CHECK (true);

-- Cột mở rộng cho quản trị (chạy an toàn nhiều lần)
ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "AccountStatus" character varying(50) NOT NULL DEFAULT 'Active';
ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "PlanName" character varying(50) NOT NULL DEFAULT 'Free';
ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "TokenBalance" integer NOT NULL DEFAULT 0;

UPDATE "UserProfiles" SET "AccountStatus" = 'Active' WHERE "AccountStatus" IS NULL OR "AccountStatus" = '';
UPDATE "UserProfiles" SET "PlanName" = 'Free' WHERE "PlanName" IS NULL OR "PlanName" = '';
UPDATE "UserProfiles" SET "TokenBalance" = 0 WHERE "TokenBalance" IS NULL;

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

-- TrafficLogs (Website & App traffic tracking - KAN-81)
CREATE TABLE IF NOT EXISTS "TrafficLogs" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" character varying(100),
    "Path" character varying(500) NOT NULL,
    "IpAddress" character varying(100) NOT NULL,
    "DeviceType" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_TrafficLogs_CreatedAt" ON "TrafficLogs" ("CreatedAt");

ALTER TABLE "TrafficLogs" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_trafficlogs" ON "TrafficLogs";
CREATE POLICY "anon_all_trafficlogs" ON "TrafficLogs" FOR ALL TO anon USING (true) WITH CHECK (true);

-- StudentProgresses (Theo dõi tiến trình học tập - LMS)
CREATE TABLE IF NOT EXISTS "StudentProgresses" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "LessonId" uuid NOT NULL,
    "LastReadChapterOrder" integer NOT NULL,
    "ProgressPercentage" integer NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_StudentProgresses_User_Lesson" ON "StudentProgresses" ("UserId", "LessonId");

ALTER TABLE "StudentProgresses" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_studentprogresses" ON "StudentProgresses";
CREATE POLICY "anon_all_studentprogresses" ON "StudentProgresses" FOR ALL TO anon USING (true) WITH CHECK (true);

-- QuizAttempts (Theo dõi đáp án quiz đã chọn)
CREATE TABLE IF NOT EXISTS "QuizAttempts" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "ChapterId" uuid NOT NULL,
    "SelectedOption" character varying(10) NOT NULL,
    "IsCorrect" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_QuizAttempts_User_Chapter" ON "QuizAttempts" ("UserId", "ChapterId");

ALTER TABLE "QuizAttempts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_quizattempts" ON "QuizAttempts";
CREATE POLICY "anon_all_quizattempts" ON "QuizAttempts" FOR ALL TO anon USING (true) WITH CHECK (true);

-- UserAchievements (Hệ thống danh hiệu / huy hiệu trang giấy)
CREATE TABLE IF NOT EXISTS "UserAchievements" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL,
    "AchievementKey" character varying(100) NOT NULL,
    "UnlockedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserAchievements_User_Key" ON "UserAchievements" ("UserId", "AchievementKey");

ALTER TABLE "UserAchievements" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_userachievements" ON "UserAchievements";
CREATE POLICY "anon_all_userachievements" ON "UserAchievements" FOR ALL TO anon USING (true) WITH CHECK (true);


