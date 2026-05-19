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
2. Thêm `ILessonStore` và `InMemoryLessonStore` để flow nhiều bước chạy được trước khi gắn database thật.
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
3. Thêm `EfLessonStore` để thay thế `InMemoryLessonStore` khi có `ConnectionStrings:MiniSeries`.
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
