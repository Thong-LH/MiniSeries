# Nhật ký hoạt động - MiniSeries

File này ghi lại các bước thực hiện của trợ lý AI Antigravity trong quá trình phát triển dự án.

## [2026-05-15] - Tích hợp API Pollinations & Xây dựng giao diện

### Đã hoàn thành:
1.  **Thiết lập cấu hình:** Thêm Pollinations API Key (`sk_...`) vào `appsettings.json`.
2.  **Triển khai Infrastructure:** Tạo `PollinationsService.cs` thực hiện các interface:
    - `ILLMService`: Phân tích bài học thành JSON.
    - `IImageGenerationService`: Tạo ảnh mỏ neo (Anchor Image).
    - `IMangaService`: Tạo các khung hình Manga.
    - `IVideoService`: Tạo các đoạn video clip ngắn.
    - `IStorageService`: Quản lý URL hình ảnh.
3.  **Cập nhật Backend:**
    - Cấu hình Dependency Injection trong `Program.cs`.
    - Tạo endpoint API `POST /api/lessons/generate`.
    - Kích hoạt phục vụ file tĩnh (Static Files).
4.  **Phát triển Frontend (wwwroot):**
    - `index.html`: Giao diện chính với phong cách Glassmorphism.
    - `styles.css`: CSS premium, dark mode, vibrant gradients.
    - `app.js`: Xử lý tương tác, gọi API và hiển thị kết quả.
5.  **Khởi chạy:** Ứng dụng đã chạy thành công tại `http://localhost:5137`.

### Ghi chú kỹ thuật:
- **LLM:** Đã chuyển đổi sang **Groq (Llama 3.3)** để tăng tốc độ và độ ổn định. Model: `llama-3.3-70b-versatile`.
- **Manga Page:** Đã nâng cấp thành công việc gen **1 ảnh chứa 4 khung hình có sẵn chữ và bong bóng thoại** do AI tự vẽ.
- **Sửa lỗi:**
    - Đã đính kèm API Key vào URL ảnh/video để tránh lỗi 401.
    - Đã cấu hình `UseDefaultFiles` để truy cập trang chủ không bị lỗi 404.
- **Lưu trữ:** Đang lên kế hoạch tích hợp **Supabase** và **Cloudinary** để lưu trữ vĩnh viễn.

### Lịch sử thay đổi gần đây:
- [x] Chuyển LLM sang Groq.
- [x] Cấu hình workflow Manga Page (4 panels/page).
- [x] Hỗ trợ AI vẽ text trực tiếp vào tranh.
- [x] Fix lỗi hiển thị ảnh (Authentication query parameter).


## [2026-05-18] - Thi?t k? l?i flow review tr??c khi sinh media

### ?ang tri?n khai:
1. Ch?t flow m?i: user nh?p lesson ? Groq t?o **k?ch b?n t?ng th?** ? user duy?t ho?c g?i feedback ? ch? sau khi duy?t m?i sinh chapter chi ti?t, anchor image v? media.
2. Ch?t b? entity n?n t?ng cho phi?n b?n ti?p theo: `Lesson`, `Chapter`, `LlmJson`, `GenerationJob`, `GenerationLog`.
3. T?o `TODO.md` ?? theo d?i to?n b? ??u vi?c refactor v? chu?n b? persistence th?t.
4. Quy ??c t? nay m?i thay ??i ??ng k? s? ???c ghi ti?p v?o file nh?t k? n?y.

## [2026-05-19] - Dựng nền domain cho flow review

### Đã hoàn thành:
1. Mở rộng `Lesson` để lưu creative mode, creative brief, output mode, trạng thái review, kịch bản tổng thể và thời điểm duyệt.
2. Chuẩn hóa `Chapter` thành đơn vị nội dung sau bước duyệt: có `LessonId`, `Summary`, `FullPrompt`, media URL và trạng thái riêng.
3. Thêm các entity vận hành:
   - `LlmJson`: lưu raw JSON từ LLM theo mục đích sử dụng.
   - `GenerationJob`: theo dõi từng lần chạy pipeline.
   - `GenerationLog`: ghi lịch sử từng bước trong mỗi job.
4. Thêm các enum phục vụ workflow: creative mode, output mode, script status, chapter status, job type/status và log level.

### Bước kế tiếp:
- Nối flow tạo draft script tổng thể, review/feedback và approve trước khi sinh chapter chi tiết + media.

## [2026-05-19] - Triển khai flow review trước khi sinh media

### Đã hoàn thành:
1. Tách LLM thành 3 nhịp rõ ràng:
   - tạo `overallScript` + `characterProfile`,
   - revise script theo feedback của user,
   - sau khi duyệt mới sinh danh sách `Chapter` chi tiết để render media.
2. Thêm `ILessonRepository` và `InMemoryLessonRepository` để flow nhiều bước chạy được trước khi gắn database thật.
3. Thêm các command mới:
   - `CreateLessonDraftCommand`
   - `ReviewLessonScriptCommand`
   - `ApproveLessonScriptCommand`
4. Thêm API mới:
   - `POST /api/lessons/drafts`
   - `POST /api/lessons/{lessonId}/review`
   - `POST /api/lessons/{lessonId}/approve`
   - `GET /api/lessons/{lessonId}`
5. Giữ lại endpoint cũ `POST /api/lessons/generate` dưới dạng legacy one-shot flow để frontend hiện tại chưa bị gãy.
6. Chuyển logic Groq sang schema mới, đồng thời dọn `PollinationsService` khỏi vai trò LLM không còn cần thiết.
7. Build solution thành công sau refactor (`0 error`).

### Ghi chú:
- Dữ liệu hiện vẫn lưu bằng in-memory store; bước tiếp theo là chốt database thật và map persistence cho các entity mới.

## [2026-05-19] - Tích hợp Supabase/Postgres và Cloudinary

### Đã hoàn thành:
1. Thêm EF Core + Npgsql để dùng Supabase như Postgres database.
2. Thêm `MiniSeriesDbContext`, map các bảng cho `Lesson`, `Chapter`, `LlmJson`, `GenerationJob`, `GenerationLog`.
3. Thêm `LessonRepository` để thay thế `InMemoryLessonRepository` khi có `ConnectionStrings:MiniSeries`.
4. Tạo migration đầu tiên `InitialPersistence` và xuất file `supabase_initial_persistence.sql` để có thể chạy trực tiếp trong Supabase SQL Editor.
5. Thêm Cloudinary SDK và `CloudinaryStorageService`; khi đủ Cloudinary config, media sẽ upload lên Cloudinary thay vì chỉ giữ Pollinations URL.
6. Thêm tài liệu `SETUP_SUPABASE_CLOUDINARY.md` hướng dẫn cấu hình Supabase, Cloudinary, migration và user-secrets.
7. Build solution thành công (`0 error`).

### Ghi chú:
- App có fallback: nếu chưa cấu hình DB thì dùng in-memory store; nếu chưa cấu hình Cloudinary thì dùng Pollinations URL tạm.
- Cần chuyển secret thật ra khỏi `appsettings.json` trước khi push/deploy.

## [2026-05-19] - Thử kết nối Supabase Direct connection

### Đã thực hiện:
1. Đã lưu `ConnectionStrings:MiniSeries` vào user-secrets của `MiniSeries.WebAPI`.
2. Đã chạy `dotnet ef database update` với Direct connection của Supabase.
3. Kết quả: Direct host `db.devnyzwnvyzgulqroyqa.supabase.co` chỉ resolve IPv6 (`AAAA`), môi trường hiện tại không dùng được để migrate qua đường Direct.

### Bước tiếp theo:
- Lấy **Session Pooler** connection string từ Supabase Connect popup rồi chạy lại migration.

## [2026-05-23] - Lam mong controller va chuyen response DTO ve Application

### Da hoan thanh:
1. Chuyen cac DTO tra ve lesson tu `MiniSeries.WebAPI/Contracts/Lessons` sang `MiniSeries.Application/Lessons/Dtos` va doi ten theo dang `LessonDto`, `ChapterDto`, `GenerationJobDto`, `GenerationLogDto`, `LlmJsonDto`.
2. Doi cac command handler `CreateLessonDraft`, `ReviewLessonScript`, `ApproveLessonScript` de tra ve `LessonDto` thay vi tra truc tiep domain entity `Lesson`.
3. Doi `CreateDraft` de controller nhan truc tiep `CreateLessonDraftCommand` tu body, khong con tu map `CreateLessonDraftRequest` sang command.
4. Them `GetLessonByIdQuery` va `GetLessonByIdQueryHandler` de controller khong goi `ILessonRepository` truc tiep nua.
5. Cap nhat `LessonsController` theo huong chi dieu huong qua MediatR va tra `Ok(result)`, khong map entity sang DTO trong controller.
6. Xoa cac WebAPI response contract cu va build solution thanh cong (`0 warning`, `0 error`).

## [2026-05-24] - Them tai lieu concept va database diagram

### Da hoan thanh:
1. Them `docs/AI_GENERATION_CONCEPT.md` de mo ta concept core AI generation flow, API flow va pham vi tich hop auth/role sau nay.
2. Them `docs/DATABASE_DIAGRAM.md` gom Mermaid ERD, relationship summary va state overview de co the copy vao draw.io.
3. Them `docs/APP_ROLE_CONCEPT.md` de ve concept tong the theo role Guest/Customer/Staff/Admin tu yeu cau cua team.
4. Them `docs/FULL_APP_DATABASE_CONCEPT.md` de phac thao database concept toan app, gom user/auth/role/payment/feedback/ticket/report va AI generation.

## [2026-05-24] - Them validation va global error handling cho lesson API

### Da hoan thanh:
1. Them cac exception dung chung trong Application: `AppValidationException`, `NotFoundException`, `BusinessRuleException`.
2. Them validation cho `CreateLessonDraftCommand`: bat buoc title/raw content, gioi han do dai input va yeu cau creative brief khi dung guided mode.
3. Them validation cho review/approve/get lesson: bat buoc lesson id hop le, feedback khong rong va gioi han do dai feedback.
4. Doi loi not found va sai trang thai review/approve sang exception ro nghia thay vi `InvalidOperationException`.
5. Them `ExceptionHandlingMiddleware` o WebAPI de tra ve `application/problem+json` voi status `400`, `404`, hoac `500` phu hop.
6. Build solution thanh cong (`0 warning`, `0 error`).
## [2026-05-29] - Them quiz tuong tac cho tung chapter

### Da hoan thanh:
1. Them entity `ChapterQuiz` va quan he one-to-one voi `Chapter`.
2. Cap nhat `ChapterDraftResult` de moi chapter co quiz gom question, 4 options, correct option va explanation.
3. Cap nhat Groq/Gemini prompt va parser de sinh quiz cung luc voi chapter sau khi approve script.
4. Cap nhat `ApproveLessonScriptCommandHandler` de tao `ChapterQuiz` cho tung chapter.
5. Cap nhat `ChapterDto`/`ChapterQuizDto` de FE nhan quiz trong response cua tung chapter.
6. Cap nhat EF mapping, repository include va migration `AddChapterQuizzes`.
7. Da apply migration `AddChapterQuizzes` len database hien tai va build solution thanh cong (`0 warning`, `0 error`).

## [2026-05-29] - Luu cau hinh Pexels API

### Da hoan thanh:
1. Them section `Pexels` vao `MiniSeries.WebAPI/appsettings.json` gom `ApiKey` va `BaseUrl`.
2. Muc dich: chuan bi tich hop `PexelsVideoService` de mock video chapter bang stock video mien phi.

## [2026-05-30] - Tach secret khoi file cau hinh tracked

### Da hoan thanh:
1. Luu cac gia tri Supabase, Cloudinary, Pollinations, Groq va Pexels hien tai vao .NET user-secrets local cua `MiniSeries.WebAPI`.
2. Doi `MiniSeries.WebAPI/appsettings.json` sang placeholder rong cho connection string va API key de tranh GitHub Push Protection.
3. Them `MiniSeries.WebAPI/appsettings.Development.example.json` lam mau cau hinh cho thanh vien khac tu dien secret rieng.
4. Cap nhat `.gitignore` de tranh commit file cau hinh local co secret.
5. Quet nhanh secret pattern trong tracked files va build solution thanh cong (`0 warning`, `0 error`).

## [2026-05-30] - Merge nhanh auth/payment/support tu nhanh AnKhang

### Da hoan thanh:
1. Fetch va merge `origin/AnKhang` vao `feature/cloud_addtion`.
2. Giu lai controller-based AI generation flow hien tai, bo phan minimal API lesson legacy cua nhanh cu.
3. Ghep them Supabase auth, OTP email, payment, customer/staff dashboard, support, feedback va report endpoints.
4. Gop mapping EF cho `ChapterQuiz` voi cac entity moi: `UserProfile`, `PaymentOrder`, `SupportRequest`, `Feedback`, `StaffReport`.
5. Chuyen `EmailSettings` va `Supabase` secret trong `appsettings.json` sang placeholder, gia tri local duoc luu vao user-secrets.
6. Build solution thanh cong sau merge (`0 warning`, `0 error`).

## [2026-05-30] - Doi sang cau hinh local JSON don gian

### Da hoan thanh:
1. Them load `appsettings.local.json` trong `Program.cs`.
2. Don gian hoa cau hinh: Git chi giu `appsettings.json` placeholder, secret that nam trong `appsettings.local.json`.
3. File `appsettings.local.json` match rule `*.local.json` nen khong bi commit len Git.

## [2026-06-01] - Step 1 auth va phan quyen JWT

### Da hoan thanh:
1. Them JWT Bearer authentication cho `MiniSeries.WebAPI`, verify Supabase access token bang JWKS endpoint thay vi dung legacy `JwtSecret`.
2. Lay role that tu `UserProfiles` sau khi token hop le, roi gan policy `CustomerOnly`, `StaffOnly`, `AdminOnly`, `StaffOrAdmin`.
3. Chan client tu set role khi dang ky; user moi mac dinh la `Customer`.
4. Bao ve cac endpoint profile, payment customer, admin dashboard, support, feedback va report bang policy phu hop.
5. Bo mock login `admin@test.com` / `staff@test.com` o frontend va them bearer token header cho cac request dashboard/payment/profile.
6. Kiem tra JWKS Supabase tra ve key `ES256/P-256` va build solution thanh cong (`0 warning`, `0 error`).

## [2026-06-01] - Refactor WebAPI sang controller

### Da hoan thanh:
1. Rut gon `Program.cs` ve bootstrap: load config, dang ky service, middleware va `MapControllers()`.
2. Tach auth setup sang `Extensions/AuthenticationExtensions.cs` va service registration sang `Extensions/ServiceCollectionExtensions.cs`.
3. Chuyen cac minimal API auth/payment/admin/support/feedback/report sang controller binh thuong.
4. Tach request model sang `Contracts/ApiRequests.cs`.
5. Tach helper bao mat sang `Security/AuthUser.cs` va `Security/SupabaseJwksKeyResolver.cs`.
6. Build solution thanh cong sau refactor (`0 warning`, `0 error`).

## [2026-06-02] - Test runtime auth/controller

### Da hoan thanh:
1. Chay `MiniSeries.WebAPI` local tai `http://localhost:5137`.
2. Kiem tra static home tra `200`.
3. Kiem tra `GET /api/feedback/public-list` doc du lieu Supabase thanh cong (`200`).
4. Kiem tra endpoint can token nhu `/api/admin/customers`, `/api/profile/{id}` va `/api/payment/create-invoice` tra `401` khi khong co bearer token.
5. Kiem tra `POST /api/auth/login-profile` voi credential sai tra `401`.
6. Kiem tra validate dang ky rong tra `400`.

### Chua test duoc:
1. Chua test duoc luong customer/staff/admin voi token that vi chua co email/password test hop le.

## [2026-06-02] - PaymentOrder persistent checkout

### Da hoan thanh:
1. Mo rong `PaymentOrder` them `UserEmail`, `PlanName`, `Status`.
2. Cap nhat EF mapping va tao migration `ExtendPaymentOrderForPersistentCheckout`.
3. Chuyen `PaymentsController` tu `PendingPayments` in-memory sang dung `MiniSeriesDbContext.PaymentOrders`.
4. `create-invoice` tao order trong DB, xoa order pending cu cua user va sinh payment code unique.
5. `bank-webhook` tim order pending trong DB, update `Paid`/`PaidAt` va insert `PaymentHistory`.
6. `check-status` doc trang thai tu `PaymentOrders` truoc, chi fallback sang `PaymentHistory` khi khong tim thay order.
7. Xoa file mock cu `MiniSeries.WebAPI/wwwroot/PaymentController.cs`.
8. Apply patch DB cho `PaymentOrders` tren Supabase va dong bo `__EFMigrationsHistory`; `dotnet ef database update` bao DB da up to date.
9. Build solution thanh cong (`0 warning`, `0 error`) va test runtime co ban: payment protected tra `401`, bank webhook khong match tra `400`.

### Con lai:
1. Chua test duoc luong tao invoice thanh cong vi can access token that tu user login.
2. Chua lam token balance/tier that trong `UserProfile`.
3. Chua them webhook secret/signature cho `bank-webhook`.

## [2026-06-02] - Test full payment flow bang JWT that

### Da hoan thanh:
1. Dang ky va xac thuc OTP cho customer test `luonghoangthong@gmail.com`.
2. Login thanh cong bang Supabase Auth va nhan access token hop le.
3. Test `POST /api/payment/create-invoice` voi bearer token: tao `PaymentOrder` trong DB thanh cong, trang thai ban dau `Pending`.
4. Sua loi `GET /api/payment/check-status` yeu cau query `userId` du thua; endpoint hien lay user dang dang nhap tu JWT.
5. Test `check-status` truoc webhook tra `isPaid=false`, `status=Pending`.
6. Test `POST /api/payment/bank-webhook` voi noi dung co payment code: order duoc update sang `Paid` va ghi `PaymentHistory`.
7. Test `check-status` sau webhook tra `isPaid=true`, `status=Paid`.
8. Build solution thanh cong sau fix (`0 warning`, `0 error`).

### Con lai:
1. Chua lam token balance/tier that trong `UserProfile`.
2. Chua them webhook secret/signature cho `bank-webhook`.

## [2026-06-02] - Them plan quota cho 3 goi

### Da hoan thanh:
1. Doi logic thanh toan tu token le sang quota generate theo goi:
   - `Free`: 3 luot/thang.
   - `Basic`: 30 luot/thang.
   - `Premium`: 100 luot/thang.
2. Them quota fields vao `UserProfile`: `PlanName`, `MonthlyGenerationLimit`, `UsedGenerationCount`, `CurrentPeriodStart`, `CurrentPeriodEnd`.
3. Them `UserPlanQuotaService` de resolve goi, cap goi sau thanh toan, reserve/refund luot generate va reset ky quota khi het han.
4. Cap nhat `bank-webhook`: khi payment order duoc xac nhan `Paid`, backend cap goi cho user va reset quota ky moi.
5. Cap nhat `ProfileController`: profile tra quota that thay vi token/tier mock.
6. Cap nhat `LessonsController`: endpoint approve yeu cau customer login, reserve 1 luot generate truoc khi approve, refund neu approve/generate fail.
7. Cap nhat `app.js`: dung flow moi `drafts -> approve`, gui bearer token va hien thi loi het quota.
8. Tao va apply migration `AddUserGenerationQuota` len Supabase.
9. Test runtime:
   - Profile ban dau cua customer test tra `Free`, `3/3` luot.
   - Tao invoice goi `Plus` duoc normalize thanh `Basic`, `30` luot.
   - Bank webhook paid cap goi `Basic`, reset quota ve `30/30`.
   - Approve lesson id khong ton tai tra `404` va quota duoc refund/giu nguyen.
10. Build solution thanh cong (`0 warning`, `0 error`).

### Con lai:
1. Chua test approve lesson thanh cong het luong AI vi se goi LLM/image/video that.
2. Chua them webhook secret/signature cho `bank-webhook`.

## [2026-06-02] - Dong bo FE sang quota generate

### Da hoan thanh:
1. Doi `pricing.html` tu token le sang 3 goi quota:
   - `Free`: 3 luot generate/thang.
   - `Basic`: 30 luot generate/thang.
   - `Premium`: 100 luot generate/thang.
2. `pricing.html` tao invoice bang `planName` va luu `targetGenerations` de checkout hien thi dung quota.
3. Cap nhat `checkout.html` de hien thi goi MiniSeries, quota generate va thong bao thanh toan theo quota thay vi Token.
4. Cap nhat `profile.html` de hien thi goi hien tai, luot da dung va luot con lai tu API profile.
5. Cap nhat `home.html` dropdown profile de hien thi luot generate con lai va link mua them goi.
6. Kiem tra cac trang `/pricing.html`, `/checkout.html`, `/profile.html`, `/home.html` deu tra `200`.
7. Build solution thanh cong (`0 warning`, `0 error`).

### Ghi chu:
1. `dashboard.html` van con mot so text Token trong khu admin mock cu; file nay dang co byte encoding loi nen chua sua bang patch de tranh lam hong file.
