# MiniSeriesLearning - Project Context & Workflow (Sprint 3)

Tài liệu này tóm tắt toàn bộ bối cảnh kiến trúc, các luồng hoạt động chính (flow), và tiến trình phát triển hiện tại của dự án **MiniSeriesLearning** để phục vụ việc tiếp tục phiên làm việc ở các phiên chat mới.

---

## 1. Tổng quan & Công nghệ (Tech Stack)
* **Frontend**: **React + TypeScript (Vite)**
  * Quản lý CSS: Vanilla CSS tùy chỉnh theo ngôn ngữ thiết kế Obsidian tối giản.
  * Tích hợp API qua file service tập trung tại `src/services/api.ts`.
* **Backend**: **ASP.NET Core (.NET 8/9)**
  * Gồm 4 Project chính chia theo mô hình Clean Architecture:
    * `MiniSeries.Domain`: Chứa các thực thể Database (`UserProfiles`, `SupportRequests`, `Feedbacks`, `PaymentHistory`, `Lesson`, `Chapter`, `GenerationJob`).
    * `MiniSeries.Application`: Chứa logic nghiệp vụ dùng Mediator Pattern (`MediatR`).
    * `MiniSeries.Infrastructure`: Kết nối PostgreSQL (Supabase DB) và các bên thứ ba:
      * **Supabase Auth**: Quản lý đăng ký, đăng nhập.
      * **Groq AI Service**: Sử dụng AI (Llama-3, v.v.) để phân tích bài học, soạn kịch bản và tạo câu hỏi tương tác.
      * **Cloudinary**: Lưu trữ ảnh truyện tranh (Manga) và video AI được tạo ra.
      * **Brevo Mail**: Gửi email chăm sóc khách hàng tự động và thủ công.
    * `MiniSeries.WebAPI`: Các API Controller, Middleware phân quyền JWT, và phục vụ file tĩnh.

---

## 2. Luồng Trải nghiệm của Khách hàng (Customer Flow)
1. **Trang chủ & Đăng nhập**: Khách hàng truy cập landing page, đăng ký hoặc đăng nhập thông qua Google Sign-In hoặc Email/Mật khẩu được lưu qua Supabase Auth.
2. **Nâng cấp gói cước**: Khách hàng xem giá tại `Pricing.tsx` và thực hiện thanh toán tại `Checkout.tsx` để nâng mức hạn ngạch (Manga/Video).
3. **Phòng sáng tạo Studio (`Studio.tsx`)**:
   * **Bước 1 (Input)**: Người dùng nhập Tiêu đề & Nội dung bài học thô, chọn xuất dạng Manga hoặc Video.
   * **Bước 2 (Drafting)**: Backend gửi dữ liệu tới Groq AI để lập kịch bản phân cảnh ban đầu.
   * **Bước 3 (Draft Review)**: Người dùng trực tiếp chỉnh sửa kịch bản nháp trên trình soạn thảo Scifi.
   * **Bước 4 (Generating)**: Chạy tiến trình xử lý nền (Tạo chương -> Vẽ nhân vật neo -> Chạy AI render ảnh/video từng chương). Frontend liên tục poll API mỗi 2 giây để hiển thị tiến trình và logs thực tế.
   * **Bước 5 (Finished)**: Người dùng nhận được bài học tương tác gồm:
     * Trình đọc chương xem ảnh truyện tranh hoặc video AI.
     * Câu hỏi trắc nghiệm (Quiz) cuối mỗi chương đi kèm đáp án đúng và lời giải chi tiết.
4. **Yêu cầu hỗ trợ (`TuVan.tsx`)**: Khách hàng gửi yêu cầu tư vấn trực tiếp từ web, lưu vào cơ sở dữ liệu dưới dạng các Ticket.

---

## 3. Luồng Quản trị Dashboard (Admin & Staff Flow)
Nhân viên (Staff) và Admin quản lý hệ thống qua trang **Dashboard (`Dashboard.tsx`)** với các tab chức năng:
* **Quản lý Khách hàng (Customers)**: Khóa/mở khóa tài khoản, xóa tài khoản khách hàng.
* **Quản lý Hạn ngạch (Tokens)**: Cộng/trừ số lượt tạo truyện/video, nâng cấp gói cước của khách hàng (Free, Basic, Premium).
* **Hỗ trợ khách hàng (Support)**:
  * *Yêu cầu tư vấn (Ticket)*: Xem các yêu cầu từ khách và viết thư phản hồi.
  * *Nhật ký CSKH (Email)*: Lưu lại tất cả lịch sử email phản hồi khách hàng (gửi đi qua dịch vụ Brevo).
* **Quản lý Đánh giá (Feedbacks)**: Xem đánh giá và số sao khách hàng chấm cho ứng dụng.
* **Báo cáo công việc (Staff Reports)**: Staff gửi báo cáo công việc lên Admin; Admin xem và phản hồi báo cáo của Staff.
* **Lịch sử thanh toán & Biểu đồ doanh thu**: Admin theo dõi toàn bộ lịch sử giao dịch nạp tiền và biểu đồ tăng trưởng doanh thu SVG.
* **Quản lý nhân viên**: Admin tạo tài khoản Staff mới hoặc khóa/xóa Staff hiện tại.

## 4. Trạng thái sau Sprint 3
Mọi tính năng cải tiến của Sprint 3 đã được hoàn thiện:
1. **Tìm kiếm, Bộ lọc & Phân trang**: Hoạt động mượt mà ở Client-side cho toàn bộ 9 bảng trên Dashboard (giới hạn hiển thị đúng 10 dòng/trang).
2. **Sắp xếp cột (Sorting) 3 trạng thái**: Click vào tiêu đề cột của tất cả 9 bảng trên Dashboard để xoay vòng: Tăng dần -> Giảm dần -> Mặc định ban đầu.
3. **Giao diện Trống (Empty) & Đang tải (Loading) cao cấp** tại Dashboard.

---

## 5. Kiến trúc ứng dụng di động Mobile App (`MiniSeries.Mobile`) - Sprint 4
Để phục vụ quá trình chuyển giao cho nhóm phát triển mobile tiếp tục tích hợp sâu, dưới đây là tổng quan cấu trúc của dự án Expo:

*   **Công nghệ**: **React Native + Expo SDK (v51/52)** kết hợp với **Expo Router** (định tuyến dựa trên thư mục) và **NativeWind** (CSS Tailwind cho mobile).
*   **Xác thực**: Kết nối với Supabase Auth, hỗ trợ đăng nhập qua tài khoản hoặc OTP qua số điện thoại.
*   **Cấu trúc thư mục định tuyến (`src/app`)**:
    *   `src/app/index.tsx`: Màn hình khởi chạy ứng dụng, kiểm tra trạng thái session để tự động chuyển hướng.
    *   `src/app/(auth)/login.tsx`: Giao diện đăng nhập OTP kết hợp Scifi space background.
    *   `src/app/(tabs)/_layout.tsx`: Layout thanh điều hướng tab phía dưới (Bottom Navigation).
    *   `src/app/(tabs)/home.tsx`: Danh sách các bài học đã tạo, hiển thị thanh tiến trình hình tròn và ảnh đại diện bài học.
    *   `src/app/(tabs)/create.tsx`: Form nhập học liệu để yêu cầu AI phân cảnh kịch bản nháp.
    *   `src/app/(tabs)/stats.tsx`: Thống kê số lượng bài học và mức độ sử dụng Token.
    *   `src/app/(tabs)/profile.tsx`: Hiển thị số lượng Token cộng dồn trọn đời, thông tin Tier gói cước, và danh sách các Thành tựu (Achievements) đi kèm badge tùy chỉnh cấp độ.
    *   `src/app/lesson/[id].tsx`: Giao diện slide xem truyện tranh (Manga) hoặc trình phát video bài học động, cuối slide có tích hợp câu hỏi trắc nghiệm `QuizSection` để kiểm tra và lưu tiến độ học tập.
    *   `src/app/support/index.tsx`: Giao diện tạo yêu cầu hỗ trợ (Support Ticket).
    *   `src/app/review/index.tsx`: Màn hình đánh giá xếp hạng ứng dụng.
*   **Các thành phần tùy chỉnh chính (`src/components`)**:
    *   `SpaceBackground.tsx`: Hoạt ảnh sao rơi vũ trụ 3D bằng React Native Reanimated.
    *   `LevelAvatar.tsx`: Avatar người dùng tích hợp vòng tròn hiển thị Level và tiến độ kinh nghiệm (XP) từ thành tựu.
    *   `InvoiceModal.tsx`: Giao diện quét mã VietQR giả lập thanh toán nạp Token.
*   **Dịch vụ API (`src/services/apiClient.ts`)**: File Axios client tập trung xử lý kết nối, tự động chèn JWT token từ bộ nhớ đệm và liên kết trực tiếp với tài liệu đặc tả [API_CONTRACT.md](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/docs/API_CONTRACT.md).

---

## 6. Trạng thái sau Sprint 4 & Mobile Friendly (Mới nhất)
1.  **Đồng bộ giao diện di động cho Web**:
    *   **Landing Page**: Tối giản hóa background nặng trên màn hình nhỏ (chỉ giữ lại sao lấp lánh và spark ma thuật, ẩn cổng sách 3D cồng kềnh để tránh giật lag GPU trên điện thoại).
    *   **3 Cột Tính năng nằm ngang**: Tự động co giãn 1/3 chiều rộng màn hình (`flex: 1 1 0%` và `max-width: 33%`), thu nhỏ hình minh họa nội bộ xuống 50% và giảm kích thước chữ để dàn trang hoàn hảo không bị vỡ.
    *   **Thanh điều hướng gọn gàng**: navbar web tự động ẩn các pill token rườm rà và tên khách hàng trên mobile, chuyển thành một nút avatar tròn nhỏ (34px) bấm để mở dropdown.
    *   **Responsive các trang nghiệp vụ**: Đã chuyển các giao diện checkout QR ngân hàng, bảng giá, biểu mẫu liên hệ hỗ trợ sang cấu trúc lưới đơn 1 cột dọc trên màn hình di động.
2.  **Hệ thống Token cộng dồn (Lifetime Token Balance)**: Di chuyển Database từ hạn mức reset hàng tháng sang mô hình số dư cộng dồn vĩnh viễn (khi nạp tiền sẽ cộng thêm vào ví hiện tại).
3.  **Tích hợp QR MB Bank / BIDV động**: Kết nối webhook cổng ngân hàng thực tế để tự động quét giao dịch hoàn thành thanh toán thời gian thực mà không cần xác nhận thủ công.
4.  **Độ ổn định**: Nhánh `develop/Sprint_4` và `main` đều sạch sẽ, chạy mượt mà trên môi trường Web lẫn Expo Simulator, code biên dịch không gặp bất kỳ lỗi nào.

