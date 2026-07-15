# Activity Log
All changes and activities are tracked below.

## [2026-07-14] - Kiểm thử tích hợp toàn trình luồng sinh truyện Manga
client secret:
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

### Đã hoàn thành:
1. **Khắc phục lỗi ngắt kết nối WebSocket (SignalR 1006) khi ẩn/hiện ứng dụng thanh toán**:
   - **Vấn đề:** Khi người dùng chuyển sang ứng dụng ngân hàng để thanh toán, hệ điều hành sẽ tự động ngắt kết nối WebSocket của app di động. Khi quay trở lại app, việc kết nối bị hủy đột ngột dẫn đến lỗi console báo đỏ liên tiếp.
   - **Khắc phục:** Sử dụng `AppState` để theo dõi trạng thái ứng dụng. Ngay khi người dùng mở lại app (Foreground), hệ thống sẽ chủ động gọi API kiểm tra trạng thái thanh toán (`check-status`) ngay lập tức để mở khóa tài khoản tức thời mà không cần chờ SignalR kết nối lại. Đồng thời bao bọc toàn bộ khối start/stop trong `try/catch` để loại bỏ hoàn toàn các lỗi console báo đỏ.
2. **Nâng cấp giao diện thanh toán & Lối tắt MoMo trên Mobile (`InvoiceModal.tsx`)**:
   - **Phóng to mã QR:** Tăng kích thước khung chứa mã QR từ 220px lên 270px (QR Image từ 200px lên 250px) để quét và lưu trữ dễ dàng.
   - **Thêm nút Sao chép (Clipboard):** Tích hợp nút 📋 kế bên các thông tin Số tài khoản, Số tiền, và Nội dung chuyển khoản giúp người dùng sao chép nhanh chóng và dán chính xác vào app ngân hàng.
   - **Lối tắt ví MoMo:** Thêm nút "Mở ví MoMo" sử dụng Deep Link liên kết trực tiếp ứng dụng ví MoMo trên thiết bị.
3. **Thiết kế lại màn hình khởi chạy / tải ứng dụng (Splash Loading Screen - `src/app/index.tsx`)**:
   - **Khắc phục:** Thay thế màn hình đen tĩnh đơn điệu bằng việc tích hợp hệ nền không gian chuyển động `SpaceBackground` mới.
   - **Giao diện Glassmorphism:** Đặt logo dự án vào vòng tròn viền xanh neon tỏa sáng, lồng trong thẻ kính mờ (Frosted Dark Glass Card) sang trọng cùng phụ đề bóng bẩy.
4. **Loại bỏ tính năng Debug & Thiết kế lại trang Đăng nhập (`src/app/(auth)/login.tsx`)**:
   - **Bỏ Debug:** Xóa bỏ hoàn toàn nút thiết lập lập trình viên (cài đặt API URL, chẩn đoán lỗi WAN/LAN/API/Supabase) và hộp thoại chẩn đoán ra khỏi màn hình đăng nhập để tối ưu hóa bảo mật và giao diện sạch sẽ cho người dùng cuối.
   - **Nới rộng giao diện:** Tăng bo góc thẻ đăng nhập lên 28px và lề trong lên 32px tạo độ thoáng rộng rãi, đồng bộ hóa căn giữa tiêu đề thương hiệu MINISERIES.
5. **Thiết kế lại giao diện Mobile tạo chiều sâu không gian (SpaceBackground & Premium Glassmorphism)**:
   - **Khắc phục:** Thay thế các View tròn phẳng mờ nhạt bằng một hệ thống hình vẽ vector SVG với ba dải chuyển sắc tỏa tròn cực kỳ mượt mà (`RadialGradient`) tạo hiệu ứng quầng sáng tinh vân (nebula glow) sâu thẳm chuẩn Sci-Fi.
   - **Nâng cấp Card & Shadows:** Bổ sung thuộc tính bóng đổ động (`cardShadow`) có chiều sâu riêng cho giao diện tối (Dark Mode) và sáng (Light Mode), kết hợp bo viền neon nhẹ nhàng (`cardBorder`) cho các thành phần thẻ quan trọng trên các trang Home (`weeklyGoalCard`, `carouselCard`), Create (`main card`) và Stats (`levelCard`, `mainStatsHeaderCard`, `historyCard`).
2. **Nâng cấp phiên bản Mobile lên v1.0.2**:
   - Tăng phiên bản ứng dụng trong `app.json` từ `1.0.1` lên `1.0.2` và chạy lại quy trình build để tạo file cài đặt APK mới nhất.
3. **Tối ưu hóa không gian hiển thị di động rộng rãi & thoáng đãng (Anti-Slop Spacing)**:
   - **Mở rộng Carousel:** Tăng tỷ lệ chiều rộng thẻ bài học ngang từ `82%` lên `88%` chiều rộng màn hình, nới rộng khoảng trống giữa các thẻ từ `12px` lên `16px` giúp giao diện phẳng phiu, phóng khoáng hơn.
   - **Tăng khoảng đệm và bo góc:** Tăng lề trong (`padding`) của ScrollView chính từ `16px-18px` lên `22px`, tăng khoảng trống cuộn đáy lên `90px` tránh bị đè nút. Đồng thời bo tròn góc các thẻ lớn từ `16px/18px` lên `22px/24px` để tăng tính sang trọng, thân thiện.
   - **Nới lỏng lưới chọn:** Tăng kích thước lề trong của các nút phong cách (Vibe Cards) và ô nhập dữ liệu, giúp tổng thể bài trí không bị dính cục hay chật chội trên thiết bị màn hình nhỏ.
3. **Tối ưu tốc độ tải ảnh mã QR thanh toán (VietQR) trên cả Web và Mobile**:
   - **Vấn đề:** Trước đây, cả Web và Mobile đều sử dụng API không chính thức từ bên thứ ba `vietqr.app` để render ảnh QR động. Do dịch vụ này lưu trữ trên máy chủ miễn phí/giá rẻ nên thường bị trễ khởi động lạnh (cold start) lên tới 32 giây cho lượt tải đầu tiên, gây trải nghiệm người dùng kém (tưởng chức năng bị lỗi).
   - **Khắc phục:** Chuyển đổi toàn bộ mã nguồn của Mobile (`InvoiceModal.tsx`) và Web (`Checkout.tsx`) sang sử dụng cổng kết nối chính thức, chất lượng cao của Napas/Cassso tại địa chỉ `img.vietqr.io`. Cổng kết nối này được hỗ trợ bởi CDN doanh nghiệp lớn nên tốc độ tải ảnh mã QR thanh toán luôn luôn là dưới 1 giây (tức thời) từ lần đầu tiên.
2. **Sửa lỗi máy trạng thái (state machine) trên giao diện duyệt kịch bản của Mobile**:
   - **Vấn đề:** Khi người dùng nhấn phê duyệt kịch bản thành công, ứng dụng chuyển sang màn hình hiển thị tiến trình tạo bài học (generating). Tuy nhiên, do component bị remount (khi cập nhật số lượng token trong AppContext), trạng thái `step` cục bộ bị reset về mặc định `'review'`. Lúc này hàm `fetchDraftDetails` chạy lại, nhưng do kịch bản đã được duyệt (`isApproved = true`) và công việc tạo ảnh/video đã hoàn thành (`isMediaReady = true`), điều kiện cũ `isApproved && !isMediaReady` bị sai (trả về false) nên ứng dụng không chuyển hướng người dùng đến màn hình bài học và bị kẹt ở màn hình duyệt kịch bản cũ.
   - **Khắc phục:** Cập nhật hàm `fetchDraftDetails` trong `MiniSeries.Mobile/src/app/review/index.tsx` để thêm điều kiện chuyển hướng tự động: Nếu bài học đã được phê duyệt và các chương học đã vẽ/tạo xong (`isApproved && isMediaReady`), ứng dụng sẽ lập tức dùng `router.replace` chuyển thẳng người dùng tới màn hình xem bài học `/lesson/[id]`.
2. **Loại bỏ thư mục cấu hình nội bộ `.agents` khỏi Git**:
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
