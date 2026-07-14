# Activity Log
All changes and activities are tracked below.

## [2026-07-14] - Kiểm thử tích hợp toàn trình luồng sinh truyện Manga
client secret:
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

### Đã hoàn thành:
1. **Loại bỏ thư mục cấu hình nội bộ `.agents` khỏi Git**:
   - Thêm quy tắc `.agents/` vào tệp `.gitignore` để ngăn Git theo dõi thư mục này trong tương lai.
   - Chạy lệnh `git rm -r --cached .agents` để xóa thư mục `.agents` khỏi cơ sở dữ liệu (index) của Git từ xa mà vẫn giữ nguyên tệp tin local trên ổ đĩa của bạn.
2. **Thiết kế lại luồng tải file APK trên thiết bị di động & máy tính (Navbar)**:
   - **Yêu cầu:** Trên giao diện máy tính, nút "Tải APK" là một tab cuộn (scroll) mượt mà xuống phần tải ứng dụng. Trên giao diện điện thoại (mobile), do không đủ diện tích hiển thị thanh navbar dài, cần hiển thị riêng nút "Tải APK" ngay cạnh nút "Bắt đầu" và khi người dùng click sẽ lập tức tải trực tiếp file APK.
   - **Khắc phục:**
     - Thiết lập ID `download-apk` cho phần tải app ở chân trang trong `Home.tsx`.
     - Cập nhật liên kết "Tải APK" trên thanh menu chính của `Layout.tsx` để thực hiện cuộn trang (scroll) mượt mà tới `#download-apk` khi ở màn hình máy tính.
     - Thêm một liên kết `.apk-nav-link-mobile` chuyên biệt trỏ thẳng đến đường dẫn tải trực tiếp file APK.
     - Cấu hình CSS responsive trong `Home.css` để ẩn nút tải trực tiếp trên máy tính và chỉ hiển thị trên màn hình điện thoại (max-width: 768px).
     - **Tối ưu hóa thứ tự hiển thị (z-index):** Tăng `z-index` của thanh `.nav` từ `100` lên `1000` để ngăn các thẻ/nút CTA ở phần nội dung trang (như nút Tạo Series) hiển thị đè lên trên thanh Navbar khi cuộn trang.
     - **Đồng bộ màu sắc:** Loại bỏ thuộc tính style màu cam của nút "Tải APK" trên giao diện máy tính để hiển thị đồng màu trắng/bạc đồng bộ tinh tế như các tab menu khác.
2. **Loại bỏ phần Quản lý nội dung trong Dashboard**:
   - Xóa bỏ hoàn toàn tab "Quản lý nội dung" và nút chuyển đổi tương ứng trên Sidebar của Dashboard.
   - Chuyển tab mặc định khi đăng nhập vào Dashboard thành "Quản lý Khách hàng".
3. **Loại bỏ trạng thái Online/Offline giả lập của Khách hàng & Staff**:
   - Loại bỏ các thẻ hiển thị số lượng khách hàng "Đang Online" và "Offline" bị mock/thiếu chính xác ở tab Quản lý khách hàng.
   - Thay thế bằng việc hiển thị trực quan các thẻ thống kê thực tế: "Tổng số khách hàng", "Đang hoạt động" và "Bị khóa" dựa trên dữ liệu database thật.
   - Đổi nhãn trạng thái hiển thị của từng dòng trong danh sách khách hàng và danh sách nhân viên từ trạng thái giả lập "Offline/Online" thành trạng thái tài khoản thực tế "Active" (màu xanh lá) hoặc "Blocked" (màu đỏ).
4. **Sửa lỗi tính toán Token / Gói cước nạp lẻ**:
   - **Vấn đề:** Khi mua gói lẻ (`addon_manga_1` hoặc `addon_video_1`), API `PaymentsController` không nhận dạng được nên đã trả về gói `Free` (làm hóa đơn hiển thị sai số lượng token cộng thêm là 4 thay vì 1).
   - **Khắc phục:** Định nghĩa thêm các gói `addon_manga_1` (1 Manga, 0 Video) và `addon_video_1` (0 Manga, 1 Video) vào `UserPlanQuotaService` của Backend. Hệ thống đã trả về chính xác số lượng token (1 token) khi người dùng chọn mua lượt lẻ.
5. **Đồng bộ động thông tin Ngân hàng thụ hưởng**:
   - **Vấn đề:** Trang checkout đang bị mock số tài khoản ("0909090909" / "MINISERIES STUDIO") khi chạy local và có logic hiển thị tên ngân hàng hardcode theo BIN.
   - **Khắc phục:** 
     - Bổ sung cấu hình `PaymentSettings` chuẩn từ file sản xuất vào `appsettings.local.json` (sử dụng tài khoản BIDV thực tế của bạn).
     - Bổ sung trường cấu hình `BankName` ở cả backend và đồng bộ trả về qua API khởi tạo hóa đơn. 
     - Thay thế logic ternary hardcode ở frontend `Checkout.tsx` bằng việc hiển thị trực tiếp `bankName` động nhận từ API. Mã VietQR và thông tin văn bản hiển thị đã khớp hoàn toàn.
