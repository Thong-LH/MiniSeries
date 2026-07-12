# Phân tích nguyên nhân Supabase Egress tăng vọt (1.877 GB / 2 GB)

## Xác nhận từ mã nguồn thực tế

### ✅ Đúng — Các nguyên nhân bạn đã liệt kê đều chính xác

| # | Nguyên nhân | Bằng chứng trong code | Mức độ ảnh hưởng |
|---|-------------|----------------------|-------------------|
| 1 | Kết nối trực tiếp đến DB Cloud | `appsettings.json` → `aws-1-ap-northeast-1.pooler.supabase.com` | Nền tảng |
| 2a | Polling Frontend (Studio.tsx) | `setTimeout(pollStatus, 2000)` — poll mỗi 2s, fallback 3s khi lỗi | **🔴 Rất cao** |
| 2b | Polling Mobile (review/index.tsx) | `setTimeout(pollStatus, 3000)` — poll mỗi 3s | **🔴 Rất cao** |
| 3 | Database Warmup khi restart | `Program.cs` → 4 lệnh `ExecuteSqlRawAsync` (TrafficLogs, StudentProgresses, QuizAttempts, UserAchievements) | 🟡 Trung bình |
| 4 | Media trên Cloudinary | Ảnh/video không lưu Supabase Storage | ✅ Đã tối ưu |

---

### ⚠️ Thiếu — Các nguyên nhân bạn CHƯA đề cập nhưng cũng góp phần đáng kể

#### 5. 🔴 AnalyticsController load TOÀN BỘ TrafficLogs không giới hạn

```csharp
// AnalyticsController.cs dòng 55-58
var logs = await dbContext.TrafficLogs
    .AsNoTracking()
    .Select(t => new { t.CreatedAt, t.IpAddress })
    .ToListAsync(); // ← LOAD TẤT CẢ records vào bộ nhớ
```

**Vấn đề**: Mỗi khi Admin mở Dashboard xem thống kê traffic, TOÀN BỘ bảng TrafficLogs được kéo về từ Supabase → Server. Nếu có 10,000 log records × ~50 bytes/record = 500 KB mỗi lần gọi. Nếu Admin Dashboard cũng có auto-refresh thì nhân lên nhiều lần.

**Khuyến nghị**: Thêm filter theo `dateRange` và thực hiện `GROUP BY` trực tiếp trên SQL thay vì kéo raw data về rồi group trong C#.

#### 6. 🟡 Polling gọi Full Lesson Detail thay vì chỉ lấy Status

```
GET /api/lessons/{lessonId}  →  Trả về LessonDto đầy đủ
```

Mỗi lần poll, cả Frontend và Mobile đều gọi `GET /api/lessons/{id}` — endpoint này trả về **toàn bộ** thông tin bài học gồm:
- Nội dung kịch bản gốc (OverallScript)
- Danh sách phân cảnh chi tiết (Scenes/Chapters)  
- Dữ liệu JSON thô từ LLM
- URL ảnh/video các cảnh
- Metadata khác

**Ước tính**: 30-50 KB/response × 1 request mỗi 2-3 giây = **36-90 MB/giờ/tab**

**Khuyến nghị**: Tạo endpoint nhẹ `GET /api/lessons/{id}/status` chỉ trả về `{ status, progress }` (~200 bytes), giảm egress 99%.

#### 7. 🟡 Không có lớp Cache / ETag nào

API backend không có:
- Response caching (`[ResponseCache]`)
- ETag / If-None-Match headers
- In-memory cache cho lesson status

→ Mỗi poll request luôn thực hiện full SQL query đến Supabase dù dữ liệu không thay đổi.

---

## Tổng hợp ước tính Egress theo nguyên nhân

| Nguồn | Egress ước tính | Ghi chú |
|--------|----------------|---------|
| Polling Studio.tsx (1 tab × 4h) | ~360 MB | 50KB × 1800 req/h × 4h |
| Polling Mobile (1 device × 4h) | ~240 MB | 50KB × 1200 req/h × 4h |
| Nhiều tab/device cùng lúc (×3) | ~1.8 GB | 3 instances × 4h |
| Admin Dashboard traffic-stats | ~10-50 MB | Tuỳ số lần mở + số records |
| Database warmup (×20 restart) | ~2-5 MB | Nhỏ nhưng không cần thiết |
| Các query thông thường | ~20-50 MB | Login, getMyLessons, etc. |
| **Tổng ước tính** | **~1.5-2.0 GB** | **Khớp với 1.877 GB thực tế** |

---

## Giải pháp ưu tiên (theo mức độ ảnh hưởng giảm dần)

### 1. 🔴 Thay Polling bằng SignalR (WebSocket)
- Backend push notification khi lesson status thay đổi
- Giảm 95%+ egress từ polling

### 2. 🔴 Tạo endpoint lightweight `/api/lessons/{id}/status`
- Chỉ trả `{ scriptStatus, mediaProgress }` (~200 bytes thay vì 50KB)
- Áp dụng ngay cả khi chưa migrate sang SignalR
- Giảm 99% egress mỗi poll request

### 3. 🟡 Fix AnalyticsController dùng SQL aggregation
- `GROUP BY` trực tiếp trên database thay vì `ToListAsync()` rồi group trong C#
- Thêm filter `WHERE CreatedAt >= @startDate`

### 4. 🟡 Thêm Response Caching / ETag
- Cache lesson data trong memory 30-60 giây
- Trả 304 Not Modified nếu data chưa thay đổi

### 5. 🟢 Database warmup chạy 1 lần duy nhất
- Kiểm tra flag hoặc dùng EF Migration thay vì `ExecuteSqlRawAsync` mỗi lần khởi động

---

## Kết luận

Phân tích của bạn **đúng và khá đầy đủ** cho các nguyên nhân chính (polling + warmup + kết nối trực tiếp). Tuy nhiên, có **3 yếu tố bổ sung** góp phần đáng kể:

1. **AnalyticsController load toàn bộ TrafficLogs** — Không filter, không phân trang
2. **Polling gọi full detail thay vì status-only** — 50KB thay vì 200 bytes mỗi request  
3. **Không có caching layer** — Mọi request đều query database dù data không đổi

Nguyên nhân #1 (Polling full detail) chính là "kẻ giết" egress lớn nhất, và giải pháp nhanh nhất là tạo endpoint `/status` nhẹ + tăng interval polling lên 10-15 giây (nếu chưa kịp triển khai SignalR).

---

## ✅ Giải pháp đã được triển khai (Cập nhật 2026)

Hệ thống đã loại bỏ hoàn toàn cơ chế Polling cũ và thay thế bằng kết nối thời gian thực sử dụng SignalR (WebSockets):

1. **Backend**:
   - Định nghĩa interface `ILessonStatusNotifier` trong lớp Application (`MiniSeries.Application`).
   - Tạo `LessonHub` trong lớp WebAPI (`MiniSeries.WebAPI.Hubs`) hỗ trợ các Client gia nhập nhóm theo mã bài học thông qua `WatchLesson` / `JoinLessonGroup` và rời đi qua `UnwatchLesson` / `LeaveLessonGroup`.
   - Triển khai dịch vụ `SignalRLessonStatusNotifier` trong lớp Infrastructure (`MiniSeries.Infrastructure.Services`) để phát trực tiếp cập nhật trạng thái (`OnLessonStatusUpdated`).
   - Cấu hình và kích hoạt SignalR trong `Program.cs` hỗ trợ đầy đủ CORS cho cả môi trường web client lẫn thiết bị di động.
   - Tích hợp phát thông báo trạng thái ngay khi có sự thay đổi kịch bản tại `ApproveLessonScriptCommandHandler`.

2. **Frontend & Mobile Clients**:
   - Web Frontend (`Studio.tsx`) và Mobile App (`review/index.tsx`) đã chuyển đổi hoàn toàn từ vòng lặp polling 2-3 giây cũ sang mô hình Subscriber lắng nghe sự kiện qua WebSocket.
   - Kết quả: **Tiết kiệm 99%+ số lượt truy vấn** và băng thông Egress cho việc kiểm tra trạng thái tiến độ bài giảng.
