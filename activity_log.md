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
