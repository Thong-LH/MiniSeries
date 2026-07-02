# TÀI LIỆU PHÂN CHIA CÔNG VIỆC JIRA (JIRA MOBILE TASKS)
Tài liệu này phân rã toàn bộ dự án Mobile App (**MiniSeries.Mobile**) thành các Epic/User Story (Jira Tickets) chi tiết. Lập trình viên hoặc Project Manager có thể sao chép trực tiếp nội dung này để tạo ticket trên Jira/Trello.

---

## Danh Sách Các Ticket Jira

### [MOB-1] Khởi tạo dự án Expo (TypeScript), Cấu hình Router & API Client
* **Epic:** Infrastructure Setup
* **Loại Ticket:** Task / Story
* **Mô tả:**
  Khởi tạo dự án React Native mới sử dụng Expo SDK với template TypeScript và cấu hình định tuyến (navigation) bằng Expo Router. Cấu hình thư viện gọi API (Axios hoặc Fetch) và cơ chế lưu trữ JWT Token an toàn.
* **Các công việc chi tiết:**
  1. Chạy lệnh tạo app: `npx create-expo-app MiniSeries.Mobile --template default --yes`.
  2. Thiết lập cấu trúc thư mục sạch sẽ (`app/`, `components/`, `services/`, `hooks/`, `constants/`).
  3. Cài đặt các thư viện thiết yếu: `expo-secure-store` (để lưu JWT token an toàn), `axios` (hoặc cấu hình `fetch` client).
  4. Cấu hình file `.env` hoặc `app.json` để quản lý `EXPO_PUBLIC_API_URL` kết nối với API cục bộ (Local IP) hoặc môi trường staging.
  5. Viết API Client helper (`services/api.ts`) hỗ trợ tự động đính kèm `Authorization: Bearer <token>` vào header của mọi request được bảo vệ.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * App khởi chạy thành công trên máy ảo (iOS/Android Simulator) và máy thật thông qua ứng dụng Expo Go.
  * Router hoạt động tốt, phân tách được nhóm luồng Auth (không cần token) và nhóm luồng App chính (yêu cầu token).
  * API Client gọi thử một API public (ví dụ: `/api/health/warmup`) hoạt động thành công.

---

### [MOB-2] Màn hình Đăng nhập, Đăng ký và Xác thực OTP
* **Epic:** Authentication
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một người dùng mới hoặc cũ, tôi muốn đăng nhập, đăng ký tài khoản và nhập mã OTP để kích hoạt tài khoản ngay trên điện thoại di động.
* **Luồng UI & Thiết kế:**
  * **Luồng Login:** Form nhập Email + Password -> Nhấn Login -> Lưu Token -> Vào Home.
  * **Luồng Register:** Nhập FullName + Email + Password + Confirm Password -> Nhấn Register -> Chuyển sang màn hình nhập OTP -> Gửi mã OTP thành công -> Tự động đăng nhập -> Vào Home.
* **Tích hợp API:**
  * Đăng ký: `POST /api/auth/register-profile`
  * Xác thực OTP: `POST /api/auth/verify-otp`
  * Đăng nhập: `POST /api/auth/login-profile`
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Nhập liệu có validation cơ bản (Email đúng định dạng, mật khẩu tối thiểu 6 ký tự, mật khẩu xác nhận phải trùng khớp).
  * Hiển thị Toast thông báo lỗi rõ ràng nếu API trả về lỗi (ví dụ: Email đã tồn tại, OTP hết hạn).
  * Khi login thành công, Token và thông tin người dùng được lưu vào `SecureStore`, đồng thời chuyển hướng người dùng sang luồng ứng dụng chính.

---

### [MOB-3] Màn hình Trang chủ (Lịch sử bài học cũ)
* **Epic:** Main Features
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một người dùng, tôi muốn xem danh sách các bài học cũ mà tôi đã tạo dưới dạng Manga hoặc Video để tôi có thể đọc lại hoặc ôn tập bất kỳ lúc nào.
* **Luồng UI & Thiết kế:**
  * Danh sách dạng lưới (Grid) hoặc danh sách dọc (List) hiển thị: Ảnh đại diện bài học (`anchorImageUrl`), Tiêu đề (`title`), Loại bài học (Manga/Video icon), Ngày tạo.
  * Có tính năng kéo để tải lại (Pull-to-refresh).
  * Trạng thái tải (Loading skeleton) khi danh sách đang tải.
  * Nhấp vào bài học sẽ điều hướng đến màn hình chi tiết bài học (`lessons/[id]`).
* **Tích hợp API:**
  * Lấy danh sách bài học của tôi: `GET /api/lessons/my`
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Hiển thị đúng danh sách bài học thuộc sở hữu của user đã đăng nhập.
  * Hiển thị giao diện thân thiện khi danh sách trống (Empty state) kèm nút "Tạo bài học ngay".
  * Nhấn vào một bài học sẽ điều hướng sang màn hình xem bài học với đúng `lessonId`.

---

### [MOB-4] Màn hình Tạo bài học mới (Studio/Create)
* **Epic:** Main Features
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một học sinh/người dùng, tôi muốn nhập đề tài học tập để AI tự động biên soạn kịch bản nháp phù hợp với nhu cầu của tôi.
* **Luồng UI & Thiết kế:**
  * Form nhập liệu bao gồm:
    * Tiêu đề bài học (Ví dụ: Vòng tuần hoàn của nước).
    * Nội dung bài học (Đoạn văn hoặc tài liệu thô).
    * Tùy chọn định dạng đầu ra: Manga (Comic) hoặc Video ngắn.
    * Tùy chọn Creative Mode: Tự động (Auto) hoặc Tự định hướng (Guided). Nếu chọn Guided, hiển thị thêm ô nhập mô tả ý tưởng/yêu cầu kịch bản ngắn (Creative Brief).
  * Nút "Tạo kịch bản nháp".
* **Tích hợp API:**
  * Tạo kịch bản nháp: `POST /api/lessons/drafts`
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Ràng buộc dữ liệu đầu vào: Bắt buộc điền Tiêu đề và Nội dung. Nếu chọn Guided, bắt buộc nhập Creative Brief.
  * Khi nhấn tạo, hiển thị vòng xoay loading. Khi API trả về kết quả thành công, điều hướng ngay lập tức sang màn hình **Duyệt kịch bản nháp (MOB-5)** kèm theo ID kịch bản vừa tạo.

---

### [MOB-5] Màn hình Duyệt kịch bản nháp (Draft Review & Approve)
* **Epic:** Main Features
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một người dùng, tôi muốn xem trước đề cương kịch bản tổng thể do AI viết để chỉnh sửa hoặc nhấn phê duyệt bắt đầu sinh ảnh/video thực tế.
* **Luồng UI & Thiết kế:**
  * Hiển thị thông tin kịch bản nháp gồm: Tiêu đề, Mô tả nhân vật (`characterProfile`), Đề cương kịch bản (`overallScript`).
  * Nút **Phê duyệt & Tạo thành phẩm** (Approve & Generate).
  * *Lưu ý:* Quá trình này sẽ gọi AI sinh ảnh, video và upload Cloudinary nên sẽ mất từ 30 giây đến 1 phút. Cần hiển thị màn hình chờ (Loading) sinh động (ví dụ: hoạt ảnh vẽ tranh/tạo video) để người dùng không cảm thấy sốt ruột.
* **Tích hợp API:**
  * Phê duyệt và bắt đầu sinh media: `POST /api/lessons/{lessonId}/approve`
* **Xử lý lỗi Quota (Hết lượt):**
  * Nếu API trả về lỗi `402 Payment Required`, chặn không cho tạo, hiển thị thông báo hết lượt kèm nút "Nâng cấp gói ngay" (điều hướng sang tab Profile/Upgrade).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Hiển thị đúng kịch bản nháp vừa tạo ở bước trước.
  * Xử lý hiển thị loading toàn màn hình trong suốt thời gian gọi API `/approve`.
  * Sau khi phê duyệt thành công, chuyển hướng người dùng sang màn hình **Xem Manga/Video (MOB-6)**.
  * Xử lý chuẩn xác mã lỗi `402` và hiển thị hộp thoại gợi ý nâng cấp gói.

---

### [MOB-6] Màn hình Đọc Manga / Xem Video bài học & Trả lời Quiz
* **Epic:** Main Features
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một người dùng, tôi muốn đọc các trang truyện tranh (Manga) hoặc xem các phân đoạn video bài học, sau đó trả lời câu hỏi trắc nghiệm (Quiz) ở cuối bài để ôn tập kiến thức.
* **Luồng UI & Thiết kế:**
  * **Chế độ Manga:**
    * Hiển thị các chương dưới dạng các trang ảnh truyện tranh xếp dọc (Vertical scroll) hoặc vuốt ngang (Horizontal slider). Các ảnh được lấy từ `chapter.mangaUrl`.
  * **Chế độ Video:**
    * Sử dụng thư viện phát video (như `expo-video` hoặc `expo-av`) để phát các chương video từ `chapter.videoUrl`. Hỗ trợ tự động chuyển chương tiếp theo khi kết thúc video hiện tại.
  * **Phần Quiz (Cuối bài):**
    * Hiển thị câu hỏi trắc nghiệm từ đối tượng `quiz` (bao gồm: Câu hỏi, 4 đáp án A, B, C, D).
    * Khi người dùng chọn đáp án:
      * Nếu đúng: Hiển thị màu xanh lá cây + Lời giải thích (`explanation`).
      * Nếu sai: Hiển thị màu đỏ ở đáp án đã chọn và tô xanh đáp án đúng + Lời giải thích.
* **Tích hợp API:**
  * Lấy chi tiết bài học (đã bao gồm các chương và quiz): `GET /api/lessons/{lessonId}`
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Tải và hiển thị mượt mà các hình ảnh Manga từ Cloudinary (sử dụng cache ảnh để tối ưu).
  * Trình phát video hoạt động ổn định, không bị giật lag, tự động chuyển chương.
  * Phần trắc nghiệm hoạt động đúng logic: Chỉ cho phép chọn 1 lần, hiển thị đúng đáp án và giải thích ngay khi chọn.

---

### [MOB-7] Màn hình Cá nhân (Profile), Quota và Nâng cấp gói (Billing)
* **Epic:** User Management & Payment
* **Loại Ticket:** User Story
* **Mô tả:**
  Là một người dùng, tôi muốn xem thông tin tài khoản của mình, kiểm tra số lượt tạo Manga/Video còn lại trong tháng, và đăng ký nâng cấp gói dịch vụ để có thêm lượt tạo.
* **Luồng UI & Thiết kế:**
  * **Thông tin cá nhân:** Họ tên, Email, Ảnh đại diện (DiceBear).
  * **Hạn mức sử dụng (Quotas):** Thanh tiến trình hiển thị số lượt đã dùng / tổng lượt của gói hiện tại (Phân tách rõ: Manga Tokens và Video Tokens).
  * **Danh sách các gói dịch vụ:**
    * *Free:* 3 manga / 1 video mỗi tháng.
    * *Basic (10.000 VNĐ):* 30 manga / 10 video mỗi tháng.
    * *Premium (50.000 VNĐ):* 100 manga / 50 video mỗi tháng.
  * **Nâng cấp gói:** Khi bấm chọn gói Basic/Premium -> Gọi API tạo hóa đơn -> Hiển thị popup hướng dẫn thanh toán (Thông tin số tiền, Nội dung chuyển khoản/Mã thanh toán). -> Nút "Kiểm tra thanh toán" để xác nhận giao dịch đã hoàn thành.
* **Tích hợp API:**
  * Xem thông tin hạn ngạch: `GET /api/profile/{userId}` hoặc `GET /api/profile/me`
  * Tạo hóa đơn: `POST /api/payment/create-invoice` (Body: `{ amount: 10000, planName: "Basic" }`)
  * Kiểm tra trạng thái thanh toán: `GET /api/payment/check-status?code={paymentCode}`
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  * Hiển thị chính xác số lượt còn lại của tài khoản.
  * Tạo hóa đơn thành công và hiển thị đúng thông tin thanh toán cho người dùng chuyển khoản.
  * Khi nhấn kiểm tra thanh toán, nếu API trả về `isPaid: true`, cập nhật ngay lập tức hạn ngạch hiển thị trên UI và thông báo nâng cấp gói thành công.
