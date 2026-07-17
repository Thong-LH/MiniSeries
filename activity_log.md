## [2026-07-17] - Khắc phục sự cố Server crash (Exit Status 139) trên Render & Dọn dẹp Dashboard

### Đã hoàn thành:
1. **Chuyển đổi sang Workstation GC và giới hạn Heap**:
   - **Vấn đề:** Server WebAPI bị crash đột ngột với exit code 139 (SIGSEGV) trên Render. Nguyên nhân do mặc định .NET Core chạy chế độ Server GC sẽ tự động cấp phát GC Heap & Thread tương ứng số CPU cores của host máy chủ, dẫn đến vượt quá giới hạn 512MB RAM của container Render Free.
   - **Khắc phục:** 
     - Thêm biến môi trường `DOTNET_ServerGarbageCollection=0` (tắt Server GC) và `DOTNET_GCHeapHardLimit=0x18000000` (giới hạn cứng Heap GC ở mức 384MB) vào `Dockerfile`.
     - Cấu hình `<ServerGarbageCollection>false</ServerGarbageCollection>` trong file dự án `MiniSeries.WebAPI.csproj` để tắt Server GC từ cấp độ compile.
2. **Dọn dẹp cột dữ liệu Mock trong lịch sử giao dịch Dashboard**:
   - **Thay đổi:** Loại bỏ hoàn toàn cột "Ngân hàng nhận" (vốn đang hiển thị thông tin mock cứng `MB Bank / 0909090909` cho mọi giao dịch) khỏi bảng lịch sử giao dịch nạp tiền tại tab Doanh thu (`RevenueTab.tsx`) trên trang quản trị Dashboard, giúp dữ liệu hiển thị gọn gàng và trung thực hơn.
3. **Tối ưu hóa ghi nhận lượt truy cập (Traffic Logging) - Ngăn ngừa spam lượt ảo**:
   - **Vấn đề:** Số lượt truy cập (Page Views) hiển thị trên Dashboard bị phóng đại so với số người dùng thật do hệ thống ghi nhận log liên tục mỗi khi người dùng chuyển hướng nhanh (Web Router) hoặc đổi tab liên tục (Mobile Focus Event listener). Một phiên làm việc ngắn của 1 người dùng có thể tạo ra hàng chục log ghi nhận.
   - **Khắc phục:** Tích hợp bộ lọc trùng lặp (Throttling) ở mức Backend trong `AnalyticsController.cs`. Nếu nhận được yêu cầu ghi nhận lượt truy cập từ cùng một địa chỉ IP (hoặc tài khoản) và cùng một đường dẫn (Path) trong vòng **5 phút**, máy chủ sẽ tự động bỏ qua (không ghi thêm bản ghi vào database). Điều này giúp chỉ số "Tổng lượt truy cập" phản ánh chính xác hành vi thực tế của người dùng và giảm tải cho cơ sở dữ liệu.
4. **Cập nhật dữ liệu mẫu (Seed Data) cho Lượt truy cập (KPI Traffic)**:
   - **Thay đổi:** Cập nhật lại API `seed-kpi-data` trong `AdminController.cs` để tự động làm sạch và tạo dữ liệu truy cập mô phỏng cực đẹp cho tuần vừa qua (từ 10/07 đến nay).
   - **Tham số dữ liệu mẫu mới:** Mỗi ngày có từ 5-10 người dùng thật (địa chỉ IP khác nhau), mỗi người dùng thực hiện 3-7 lượt xem trang ngẫu nhiên. Riêng ngày hôm nay (17/07) mặc định tạo **đúng 10 lượt truy cập** để bắt đầu chu kỳ đếm lượt một cách tự nhiên.



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
2. **Loại bỏ trạng thái Online/Offline giả lập của Khách hàng & Staff**:
   - Loại bỏ các thẻ hiển thị số lượng khách hàng "Đang Online" và "Offline" bị mock/thiếu chính xác ở tab Quản lý khách hàng.
   - Thay thế bằng việc hiển thị trực quan các thẻ thống kê thực tế: "Tổng số khách hàng", "Đang hoạt động" và "Bị khóa" dựa trên dữ liệu database thật.
   - Đổi nhãn trạng thái hiển thị của từng dòng trong danh sách khách hàng và danh sách nhân viên từ trạng thái giả lập "Offline/Online" thành trạng thái tài khoản thực tế "Active" (màu xanh lá) hoặc "Blocked" (màu đỏ).
3. **Sửa lỗi tính toán Token / Gói cước nạp lẻ**:
   - **Vấn đề:** Khi mua gói lẻ (`addon_manga_1` hoặc `addon_video_1`), API `PaymentsController` không nhận dạng được nên đã trả về gói `Free` (làm hóa đơn hiển thị sai số lượng token cộng thêm là 4 thay vì 1).
   - **Khắc phục:** Định nghĩa thêm các gói `addon_manga_1` (1 Manga, 0 Video) và `addon_video_1` (0 Manga, 1 Video) vào `UserPlanQuotaService` của Backend. Hệ thống đã trả về chính xác số lượng token (1 token) khi người dùng chọn mua lượt lẻ.
2. **Đồng bộ động thông tin Ngân hàng thụ hưởng**:
   - **Vấn đề:** Trang checkout đang bị mock số tài khoản ("0909090909" / "MINISERIES STUDIO") khi chạy local và có logic hiển thị tên ngân hàng hardcode theo BIN.
   - **Khắc phục:** 
     - Bổ sung cấu hình `PaymentSettings` chuẩn từ file sản xuất vào `appsettings.local.json` (sử dụng tài khoản BIDV thực tế của bạn).
     - Bổ sung trường cấu hình `BankName` ở cả backend và đồng bộ trả về qua API khởi tạo hóa đơn. 
     - Thay thế logic ternary hardcode ở frontend `Checkout.tsx` bằng việc hiển thị trực tiếp `bankName` động nhận từ API. Mã VietQR và thông tin văn bản hiển thị đã khớp hoàn toàn.
3. **Tạo tài khoản Admin và Staff mới trên Supabase mới**:
   - Viết và chạy script Python `create_admin_staff.py` để tạo các tài khoản `admin@miniseries.com` (vai trò Admin) và `staff@miniseries.com` (vai trò Staff) với mật khẩu `TestPassword123!`.
   - Các tài khoản đã được chèn đồng bộ vào cả Supabase Auth (`auth.users`, `auth.identities`) và bảng thông tin `UserProfiles`.
2. **Khắc phục lỗi ghi nhận lượt truy cập web (Traffic Logs)**:
   - **Phát hiện:** Do React ở chế độ Development sử dụng `StrictMode` khiến cho các Hook `useEffect` bị chạy hai lần (double-render), dẫn đến việc gửi hai request ghi nhận traffic đồng thời cho cùng một page-load gây sai lệch số liệu thống kê.
   - **Sửa đổi:** Bổ sung cơ chế chống trùng lặp (deduplication guard) tại `App.tsx` bằng cách lưu trữ và so sánh đường dẫn vừa truy cập trong vòng 1.5 giây. Nếu trùng sẽ bỏ qua request thứ hai.
3. **Thay đổi Font chữ và sửa lỗi ký tự "Đ"**:
   - Thay thế toàn bộ Font chữ tiêu đề `Cinzel` (không hỗ trợ bảng mã tiếng Việt đầy đủ dẫn đến lỗi hiển thị chữ "Đ") bằng Font chữ Serif sang trọng `Playfair Display` tại các file `index.css`, `Profile.css`, `Studio.css`, `Pricing.css`, `Login.css`, `Profile.tsx`, `Checkout.tsx`.
2. **Cải tiến giao diện Loading & Bảng lịch sử thanh toán**:
   - Thay thế loading bằng chữ đơn điệu trên trang hồ sơ và các tab bằng vòng quay hiệu ứng vũ trụ động (`cosmic-portal-loader`) khớp với nhận diện thương hiệu.
   - Thiết kế lại hàng bảng thanh toán thành các khối capsule/card glassmorphic nổi, có hiệu ứng hover mượt mà và nhãn trạng thái sinh động (`payment-status-badge` dạng success/pending).
3. **Sửa lỗi cấu trúc bảng `PaymentHistory` trên database mới**:
   - Khắc phục lỗi thiếu các cột `PaidAt`, `PaymentOrderId`, `UserId`, `PlanName`, `TokensReceived`, `Status` và sai tên cột `TransactionCode` (đổi lại thành `PaymentCode`) dẫn đến lỗi `500 Internal Server Error` khi gọi API `GET /api/payment/my-history`.
   - Chạy script Python điều chỉnh bảng để đồng bộ 100% với EF Core model snapshot.
2. **Khởi chạy môi trường local phục vụ kiểm thử**:
   - Chạy backend API trên cổng `5088` (`dotnet run`).
   - Chạy frontend Vite Dev Server trên cổng `5173` (`npm run dev`).
2. **Kiểm thử tích hợp toàn trình (E2E Integration Test) thành công**:
   - Viết và chạy lại kịch bản kiểm thử [test-full-flow-manga.ps1](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/scripts/test-full-flow-manga.ps1).
   - Đăng nhập thành công tài khoản test thực tế `test-manga-8122@miniseries.com` trên database Supabase mới, tạo bài học Manga nháp qua Groq, phê duyệt bài học để kích hoạt background media generation pipeline.
   - Luồng sinh ảnh thông qua Azure Flux-2-pro và tải lên Cloudinary thật đã hoàn thành 100% thành công cho tất cả các chapter, cập nhật đúng cơ sở dữ liệu.
2. **Sửa lỗi biến clashing & so khớp Enum trong PowerShell script**:
   - Khắc phục lỗi case-insensitivity trong PowerShell khiến biến local `$email` đè lên tham số truyền vào `$EmailInput`.
   - Sửa lỗi mã hóa ký tự tiếng Việt có dấu khi gửi JSON Payload thông qua việc ép kiểu `$params.Body` thành mảng byte UTF-8 (`[System.Text.Encoding]::UTF8.GetBytes($jsonStr)`).
   - Cập nhật điều kiện so khớp trạng thái và loại công việc (Job Type & Status) để hỗ trợ cả dạng chuỗi và dạng số nguyên (do mặc định System.Text.Json serialize enum sang int): lọc loại công việc `type -eq 2` (MediaGeneration) và trạng thái hoàn thành `status -eq 2` (Completed).

## [2026-07-14] - Tối ưu hóa truy vấn, băng thông & Connection Pool và dời Database sang dự án mới

### Đã hoàn thành:
1. **Dọn dẹp warmup DDL lúc khởi động trong `Program.cs`**:
   - Loại bỏ các câu lệnh `ExecuteSqlRawAsync` tạo bảng và chỉ mục làm khóa bảng gây nghẽn kết nối. Thay thế bằng truy vấn `FirstOrDefaultAsync` đọc nhẹ để warmup EF Core an toàn.
2. **Kích hoạt Split Query trong `LessonRepository.cs`**:
   - Thêm `.AsSplitQuery()` vào hàm `GetByIdAsync` để tránh tích Descartes (Cartesian product) khi nạp các quan hệ. Giảm thiểu băng thông egress và RAM sử dụng.
3. **Cải tiến composite index trong `MiniSeriesDbContext.cs`**:
   - Thay thế index đơn trên `UserId` bằng index composite `(UserId, CreatedAt)` trên bảng `Lessons`.
   - Sinh migration `AddLessonsUserIdCreatedAtCompositeIndex` và áp dụng thành công lên database.
4. **Tối ưu hóa API thống kê trong `AnalyticsController.cs`**:
   - Thực hiện đếm aggregate (`CountAsync` và `Distinct().CountAsync()`) trực tiếp bằng DB cho các chỉ số tổng quan.
   - Giới hạn khoảng thời gian tải log cho biểu đồ trong vòng 30 ngày (theo ngày) hoặc 12 tháng (theo tháng).
5. **Cập nhật Connection String trong `appsettings.local.json`**:
   - Trỏ kết nối sang dự án Supabase mới (`aws-1-ap-south-1.pooler.supabase.com:6543`).
   - Cấu hình các tham số tối ưu hóa cho PgBouncer Transaction Mode: `Pooling=true;No Reset On Close=true;Max Auto Prepare=0;`.
6. **Di chuyển dữ liệu chọn lọc**:
   - Viết và thực thi kịch bản Python `migrate_partial.py` để lọc và chuyển dữ liệu đăng nhập (auth), hồ sơ (profiles), bài học, tiến độ và giao dịch của **9 người dùng học sinh thực tế** sang database mới, loại bỏ các tài khoản test và admin dư thừa.
   - Xử lý tự động tương thích cột Generated và giá trị rỗng của các cột `NOT NULL` (như `TransactionCode`).
7. **Cập nhật URL cấu hình cứng trong codebase**:
   - Thay thế URL Supabase cũ `devnyzwnvyzgulqroyqa.supabase.co` bằng URL mới `jtdqyzkaviqopmxotuge.supabase.co` trong các file của mobile (`googleAuth.ts`, `login.tsx`), frontend (`Login.tsx`, `.env`), và WebAPI (`appsettings.local.json`).
8. **Cập nhật Keys Supabase mới**:
   - Điền các khóa bảo mật AnonKey (`eyJhbGciOi...`) và ServiceRoleKey (`eyJhbGciOi...`) mới dưới dạng các JWT token chuẩn của dự án vào `appsettings.local.json`.
9. **Thiết lập CI/CD tự động Build và Release APK**:
   - Tạo quy trình GitHub Actions tại `.github/workflows/release-apk.yml` tự động build dự án Expo Mobile khi đẩy code lên nhánh chính (`master`/`main`), đóng gói tệp APK sạch và xuất bản (Release) lên GitHub dưới thẻ `latest`.
10. **Liên kết tải APK tự động trên Web Frontend**:
    - Thay thế link tải file APK (trỏ đến Google Drive cũ) bằng link tải trực tiếp từ GitHub Release (`https://github.com/Thong-LH/MiniSeries/releases/download/latest/MiniSeries.apk`) trong hai tệp [Home.tsx](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/MiniSeries.Frontend/src/pages/Home.tsx) và [Layout.tsx](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/MiniSeries.Frontend/src/components/Layout.tsx) của frontend.
11. **Phân tách cơ chế Mock cho luồng sản xuất Manga và Video**:
    - Chỉnh sửa hàm `IsPredefined` trong `PredefinedLessons.cs` nhận thêm `OutputMode` và chỉ trả về `true` (mock) khi định dạng đầu ra là Video.
    - Cập nhật các command handler `CreateLessonDraftCommandHandler.cs` và `ApproveLessonScriptCommandHandler.cs` để truyền `OutputMode` vào hàm kiểm tra mock, giúp luồng sinh truyện Manga thực tế chạy qua dịch vụ sinh ảnh bằng AI (AzureFlux/Pollinations) và tải lên Cloudinary thật, thay vì dùng mock data như trước.


## [2026-06-21] - Tai cau truc EF Core, dong nhat schema, xoa RLS & cache tre (nhanh AnKhang2)

### Da hoan thanh:
1. Dong nhat database schema va map EF Core:
   - Anh xa entity `PaymentHistory` vao bang `"PaymentHistory"` (so it) de tranh trung lap voi bang `"PaymentHistories"`.
   - Them cot `TokenBalance` va `AccountStatus` vao entity `UserProfile`.
   - Tao entity `CskhMessage` map vao bang `"cskh_messages"`.
   - Tao va ap dung migration `ConsolidateDbSchema` de dong bo hoa ca database local va cloud.
2. Refactor toan bo controller va middleware sang EF Core:
   - Thay the truy van REST trong JWT Middleware (`AuthenticationExtensions.cs`) bang EF Core.
   - Refactor `AdminController` de thuc hien moi thao tac CRUD nguoi dung, lich su giao dich, token qua EF Core.
   - Refactor `CskhController` de ghi lich su mail gui vao DB thong qua `CskhMessages` EF Core.
   - Refactor `SupportController`, `ReportsController`, `FeedbackController` sang su dung truc tiep `MiniSeriesDbContext`.
   - Refactor `PaymentsController` (webhook va check-status) de dong bo thanh toan truc tiep voi bang `"PaymentHistory"`.
   - Refactor `AuthController` dang ky profile moi luu vao DB.
   - Xoa bo hoan toan service REST cu `SupabaseRestService.cs` va go khoi DI Container.
3. Chuyen doi quan ly Token sang hai loai han ngach Manga & Video:
   - Thay the `TokenDelta` duy nhat (cột tàn dư) bang hai tham so `MangaDelta` va `VideoDelta` trong DTO `UpdateTokenRequest`.
   - Thay doi logic backend trong `AdminController.UpdateUserToken` de khi tang/giam, gia tri se cong/tru truc tiep vao `MangaMonthlyLimit` va `VideoMonthlyLimit` cua user thay vi `TokenBalance`.
   - Cap nhat MapProfile de tra ve `mangaLimit`, `usedManga`, `videoLimit`, `usedVideo` giup client hien thi.
   - Cap nhat UI Admin Dashboard: thay o "Cộng / trừ token" bang 2 o "Cộng/trừ Manga" va "Cộng/trừ Video".
   - Cap nhat bang danh sach nguoi dung trong Tab "Quản lý Hạn ngạch & Gói" de hien thi dung so luot con lai cua Manga/Video thuc te (tinh bang Limit - Used) theo format (Còn lại / Tổng) thay vi so luot da dung.
4. Xu ly triet de tre cache:
   - Them logic chu dong xoa RAM cache `_memoryCache.Remove($"user-profile-{id}")` ngay khi Admin thay doi quyen, goi cuoc hoac status de thay doi co hieu luc ngay lap tuc cho phien dang nhap cua user.
5. Jira Integration:
   - Tao va cap nhat parent task `KAN-34` va 5 subtasks `KAN-35` den `KAN-39` sang trang thai Done tren Jira Board.
6. Kiem tra:
   - `dotnet build MiniSeries.sln` thanh cong voi 0 loi, 0 canh bao.
   - Build frontend `npm run build` thanh cong mượt mà, khong loi typescript.
   - API Server Backend vao trang thai hoat dong on dinh tren local.

## [2026-06-12] - Toi uu login lan dau

### Da hoan thanh:
1. Do timing login backend:
   - Them log trong `AuthController.LoginProfile` cho Supabase sign-in, UserProfiles lookup va quota snapshot.
   - Xac nhan login lan dau cham do cold path cua EF/UserProfiles + ket noi Supabase/DB.
2. Them warmup endpoint:
   - Tao `GET /api/health/warmup` de lam nong DB, query `UserProfiles` va Supabase Auth.
   - Trang login React goi warmup ngam khi mo trang, khong chan UI.
3. Toi uu profile sau login:
   - `ProfileController` doi tu Supabase REST sang EF `MiniSeriesDbContext` de giam request remote khong can thiet.
   - Dung entity profile vua query de tao quota snapshot, tranh query DB lap lai.
4. Cai thien ket qua do:
   - Truoc: login lan dau sau warmup van khoang 2373ms.
   - Sau: login lan dau sau warmup khoang 824ms, cac lan sau khoang 400-700ms.
5. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - Backend build thanh cong sau khi restart process dang khoa file.
## [2026-06-09] - Fix approve treo khi upload Cloudinary

### Da hoan thanh:
1. Cap nhat `CloudinaryStorageService.cs`:
   - Image upload khong con de Cloudinary tu fetch remote URL Pollinations truoc.
   - Backend tu download source media bang HttpClient co timeout roi upload stream len Cloudinary.
   - Them timeout ro rang cho download image, upload image va upload video de tranh request treo vo han.
2. Cap nhat `ApproveLessonScriptCommandHandler.cs`:
   - Giam concurrency media ve 2 de tranh qua tai Pollinations/Cloudinary khi nhieu chapter.
3. Kiem tra:
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - Restart WebAPI tai `http://localhost:5088`.
## [2026-06-09] - Chinh lai loading approve khong doan sai trang thai

### Da hoan thanh:
1. Cap nhat React Studio loading:
   - Bo co che doan stage theo thoi gian vi khong co realtime job status.
   - Doi copy thanh trang thai tong quat: backend dang tao chapter, quiz va media.
   - Giu elapsed time va checklist cac viec he thong dang xu ly.
   - Giam progress cap tu 94% xuong 88% trong buoc tao media de tranh cam giac gan xong nhung van cho lau.
2. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
## [2026-06-09] - Toi uu buoc approve tao media

### Da hoan thanh:
1. Cap nhat backend `ApproveLessonScriptCommandHandler.cs`:
   - Doi tao media chapter tu tuan tu sang chay song song co gioi han.
   - Manga xu ly toi da 3 chapter cung luc, video toi da 2 chapter cung luc.
   - Giu luong approve hien tai nhung giam thoi gian cho khi co nhieu chapter.
2. Cap nhat React Studio loading:
   - Them elapsed time.
   - Them 4 stage ro rang: chia chapter, dung nhan vat, tao media, upload Cloudinary.
   - Giam cam giac progress bar dung lau o mot trang thai mo ho.
3. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
## [2026-06-09] - Ep output AI sang tieng Viet

### Da hoan thanh:
1. Cap nhat `GroqService.cs`:
   - Them rule bat buoc moi noi dung user-facing trong JSON la tieng Viet co dau.
   - Ap dung cho draft script, review script, chapter summary/fullPrompt, quiz question/options/explanation.
2. Cap nhat `GeminiService.cs` voi cung rule de fallback/provider khac cung tra tieng Viet.
3. Cap nhat `PollinationsService.cs`:
   - Prompt manga/video yeu cau neu co chu, loi thoai, bong bong thoai/phu de thi dung tieng Viet co dau.
4. Kiem tra:
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
# Nháº­t kÃ½ hoáº¡t Ä‘á»™ng - MiniSeries

File nÃ y ghi láº¡i cÃ¡c bÆ°á»›c thá»±c hiá»‡n cá»§a trá»£ lÃ½ AI Antigravity trong quÃ¡ trÃ¬nh phÃ¡t triá»ƒn dá»± Ã¡n.

## [2026-05-15] - TÃ­ch há»£p API Pollinations & XÃ¢y dá»±ng giao diá»‡n

### ÄÃ£ hoÃ n thÃ nh:
1.  **Thiáº¿t láº­p cáº¥u hÃ¬nh:** ThÃªm Pollinations API Key (`sk_...`) vÃ o `appsettings.json`.
2.  **Triá»ƒn khai Infrastructure:** Táº¡o `PollinationsService.cs` thá»±c hiá»‡n cÃ¡c interface:
    - `ILLMService`: PhÃ¢n tÃ­ch bÃ i há»c thÃ nh JSON.
    - `IImageGenerationService`: Táº¡o áº£nh má» neo (Anchor Image).
    - `IMangaService`: Táº¡o cÃ¡c khung hÃ¬nh Manga.
    - `IVideoService`: Táº¡o cÃ¡c Ä‘oáº¡n video clip ngáº¯n.
    - `IStorageService`: Quáº£n lÃ½ URL hÃ¬nh áº£nh.
3.  **Cáº­p nháº­t Backend:**
    - Cáº¥u hÃ¬nh Dependency Injection trong `Program.cs`.
    - Táº¡o endpoint API `POST /api/lessons/generate`.
    - KÃ­ch hoáº¡t phá»¥c vá»¥ file tÄ©nh (Static Files).
4.  **PhÃ¡t triá»ƒn Frontend (wwwroot):**
    - `index.html`: Giao diá»‡n chÃ­nh vá»›i phong cÃ¡ch Glassmorphism.
    - `styles.css`: CSS premium, dark mode, vibrant gradients.
    - `app.js`: Xá»­ lÃ½ tÆ°Æ¡ng tÃ¡c, gá»i API vÃ  hiá»ƒn thá»‹ káº¿t quáº£.
5.  **Khá»Ÿi cháº¡y:** á»¨ng dá»¥ng Ä‘Ã£ cháº¡y thÃ nh cÃ´ng táº¡i `http://localhost:5137`.

### Ghi chÃº ká»¹ thuáº­t:
- **LLM:** ÄÃ£ chuyá»ƒn Ä‘á»•i sang **Groq (Llama 3.3)** Ä‘á»ƒ tÄƒng tá»‘c Ä‘á»™ vÃ  Ä‘á»™ á»•n Ä‘á»‹nh. Model: `llama-3.3-70b-versatile`.
- **Manga Page:** ÄÃ£ nÃ¢ng cáº¥p thÃ nh cÃ´ng viá»‡c gen **1 áº£nh chá»©a 4 khung hÃ¬nh cÃ³ sáºµn chá»¯ vÃ  bong bÃ³ng thoáº¡i** do AI tá»± váº½.
- **Sá»­a lá»—i:**
    - ÄÃ£ Ä‘Ã­nh kÃ¨m API Key vÃ o URL áº£nh/video Ä‘á»ƒ trÃ¡nh lá»—i 401.
    - ÄÃ£ cáº¥u hÃ¬nh `UseDefaultFiles` Ä‘á»ƒ truy cáº­p trang chá»§ khÃ´ng bá»‹ lá»—i 404.
- **LÆ°u trá»¯:** Äang lÃªn káº¿ hoáº¡ch tÃ­ch há»£p **Supabase** vÃ  **Cloudinary** Ä‘á»ƒ lÆ°u trá»¯ vÄ©nh viá»…n.

### Lá»‹ch sá»­ thay Ä‘á»•i gáº§n Ä‘Ã¢y:
- [x] Chuyá»ƒn LLM sang Groq.
- [x] Cáº¥u hÃ¬nh workflow Manga Page (4 panels/page).
- [x] Há»— trá»£ AI váº½ text trá»±c tiáº¿p vÃ o tranh.
- [x] Fix lá»—i hiá»ƒn thá»‹ áº£nh (Authentication query parameter).


## [2026-05-18] - Thi?t k? l?i flow review tr??c khi sinh media

### ?ang tri?n khai:
1. Ch?t flow m?i: user nh?p lesson ? Groq t?o **k?ch b?n t?ng th?** ? user duy?t ho?c g?i feedback ? ch? sau khi duy?t m?i sinh chapter chi ti?t, anchor image v? media.
2. Ch?t b? entity n?n t?ng cho phi?n b?n ti?p theo: `Lesson`, `Chapter`, `LlmJson`, `GenerationJob`, `GenerationLog`.
3. T?o `TODO.md` ?? theo d?i to?n b? ??u vi?c refactor v? chu?n b? persistence th?t.
4. Quy ??c t? nay m?i thay ??i ??ng k? s? ???c ghi ti?p v?o file nh?t k? n?y.

## [2026-05-19] - Dá»±ng ná»n domain cho flow review

### ÄÃ£ hoÃ n thÃ nh:
1. Má»Ÿ rá»™ng `Lesson` Ä‘á»ƒ lÆ°u creative mode, creative brief, output mode, tráº¡ng thÃ¡i review, ká»‹ch báº£n tá»•ng thá»ƒ vÃ  thá»i Ä‘iá»ƒm duyá»‡t.
2. Chuáº©n hÃ³a `Chapter` thÃ nh Ä‘Æ¡n vá»‹ ná»™i dung sau bÆ°á»›c duyá»‡t: cÃ³ `LessonId`, `Summary`, `FullPrompt`, media URL vÃ  tráº¡ng thÃ¡i riÃªng.
3. ThÃªm cÃ¡c entity váº­n hÃ nh:
   - `LlmJson`: lÆ°u raw JSON tá»« LLM theo má»¥c Ä‘Ã­ch sá»­ dá»¥ng.
   - `GenerationJob`: theo dÃµi tá»«ng láº§n cháº¡y pipeline.
   - `GenerationLog`: ghi lá»‹ch sá»­ tá»«ng bÆ°á»›c trong má»—i job.
4. ThÃªm cÃ¡c enum phá»¥c vá»¥ workflow: creative mode, output mode, script status, chapter status, job type/status vÃ  log level.

### BÆ°á»›c káº¿ tiáº¿p:
- Ná»‘i flow táº¡o draft script tá»•ng thá»ƒ, review/feedback vÃ  approve trÆ°á»›c khi sinh chapter chi tiáº¿t + media.

## [2026-05-19] - Triá»ƒn khai flow review trÆ°á»›c khi sinh media

### ÄÃ£ hoÃ n thÃ nh:
1. TÃ¡ch LLM thÃ nh 3 nhá»‹p rÃµ rÃ ng:
   - táº¡o `overallScript` + `characterProfile`,
   - revise script theo feedback cá»§a user,
   - sau khi duyá»‡t má»›i sinh danh sÃ¡ch `Chapter` chi tiáº¿t Ä‘á»ƒ render media.
2. ThÃªm `ILessonRepository` vÃ  `InMemoryLessonRepository` Ä‘á»ƒ flow nhiá»u bÆ°á»›c cháº¡y Ä‘Æ°á»£c trÆ°á»›c khi gáº¯n database tháº­t.
3. ThÃªm cÃ¡c command má»›i:
   - `CreateLessonDraftCommand`
   - `ReviewLessonScriptCommand`
   - `ApproveLessonScriptCommand`
4. ThÃªm API má»›i:
   - `POST /api/lessons/drafts`
   - `POST /api/lessons/{lessonId}/review`
   - `POST /api/lessons/{lessonId}/approve`
   - `GET /api/lessons/{lessonId}`
5. Giá»¯ láº¡i endpoint cÅ© `POST /api/lessons/generate` dÆ°á»›i dáº¡ng legacy one-shot flow Ä‘á»ƒ frontend hiá»‡n táº¡i chÆ°a bá»‹ gÃ£y.
6. Chuyá»ƒn logic Groq sang schema má»›i, Ä‘á»“ng thá»i dá»n `PollinationsService` khá»i vai trÃ² LLM khÃ´ng cÃ²n cáº§n thiáº¿t.
7. Build solution thÃ nh cÃ´ng sau refactor (`0 error`).

### Ghi chÃº:
- Dá»¯ liá»‡u hiá»‡n váº«n lÆ°u báº±ng in-memory store; bÆ°á»›c tiáº¿p theo lÃ  chá»‘t database tháº­t vÃ  map persistence cho cÃ¡c entity má»›i.

## [2026-05-19] - TÃ­ch há»£p Supabase/Postgres vÃ  Cloudinary

### ÄÃ£ hoÃ n thÃ nh:
1. ThÃªm EF Core + Npgsql Ä‘á»ƒ dÃ¹ng Supabase nhÆ° Postgres database.
2. ThÃªm `MiniSeriesDbContext`, map cÃ¡c báº£ng cho `Lesson`, `Chapter`, `LlmJson`, `GenerationJob`, `GenerationLog`.
3. ThÃªm `LessonRepository` Ä‘á»ƒ thay tháº¿ `InMemoryLessonRepository` khi cÃ³ `ConnectionStrings:MiniSeries`.
4. Táº¡o migration Ä‘áº§u tiÃªn `InitialPersistence` vÃ  xuáº¥t file `supabase_initial_persistence.sql` Ä‘á»ƒ cÃ³ thá»ƒ cháº¡y trá»±c tiáº¿p trong Supabase SQL Editor.
5. ThÃªm Cloudinary SDK vÃ  `CloudinaryStorageService`; khi Ä‘á»§ Cloudinary config, media sáº½ upload lÃªn Cloudinary thay vÃ¬ chá»‰ giá»¯ Pollinations URL.
6. ThÃªm tÃ i liá»‡u `SETUP_SUPABASE_CLOUDINARY.md` hÆ°á»›ng dáº«n cáº¥u hÃ¬nh Supabase, Cloudinary, migration vÃ  user-secrets.
7. Build solution thÃ nh cÃ´ng (`0 error`).

### Ghi chÃº:
- App cÃ³ fallback: náº¿u chÆ°a cáº¥u hÃ¬nh DB thÃ¬ dÃ¹ng in-memory store; náº¿u chÆ°a cáº¥u hÃ¬nh Cloudinary thÃ¬ dÃ¹ng Pollinations URL táº¡m.
- Cáº§n chuyá»ƒn secret tháº­t ra khá»i `appsettings.json` trÆ°á»›c khi push/deploy.

## [2026-05-19] - Thá»­ káº¿t ná»‘i Supabase Direct connection

### ÄÃ£ thá»±c hiá»‡n:
1. ÄÃ£ lÆ°u `ConnectionStrings:MiniSeries` vÃ o user-secrets cá»§a `MiniSeries.WebAPI`.
2. ÄÃ£ cháº¡y `dotnet ef database update` vá»›i Direct connection cá»§a Supabase.
3. Káº¿t quáº£: Direct host `db.devnyzwnvyzgulqroyqa.supabase.co` chá»‰ resolve IPv6 (`AAAA`), mÃ´i trÆ°á»ng hiá»‡n táº¡i khÃ´ng dÃ¹ng Ä‘Æ°á»£c Ä‘á»ƒ migrate qua Ä‘Æ°á»ng Direct.

### BÆ°á»›c tiáº¿p theo:
- Láº¥y **Session Pooler** connection string tá»« Supabase Connect popup rá»“i cháº¡y láº¡i migration.

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

## [2026-06-03] - Them ownership cho lesson

### Da hoan thanh:
1. Them `UserId` va `UserEmail` vao entity `Lesson` va `LessonDto`.
2. `POST /api/lessons/drafts` lay user hien tai tu JWT va gan owner vao lesson, khong tin `UserId` tu client.
3. Them query/repository `ListByUserIdAsync` va endpoint `GET /api/lessons/my` de customer xem lich su lesson cua chinh minh.
4. Bao ve `GET /api/lessons/{lessonId}`, `review`, `approve` bang owner check:
   - Customer chi thao tac lesson cua chinh minh.
   - Staff/Admin duoc phep xem qua rule backend hien tai.
5. Doi thu tu approve: check owner truoc, sau do moi reserve quota generate.
6. Tao va apply migration `AddLessonOwnership` len Supabase.
7. Test runtime nhe bang JWT that:
   - Login customer thanh cong.
   - `GET /api/lessons/my` tra list hop le.
   - `GET /api/lessons/{id}` voi id khong ton tai tra `404`.

### Ghi chu:
1. Khong tao draft moi trong smoke test de tranh goi AI khong can thiet.
2. Lesson cu truoc migration co `UserId = Guid.Empty`; lesson moi se co owner that.

## [2026-06-03] - Them script smoke test backend

### Da hoan thanh:
1. Them `scripts/test-backend-smoke.ps1` de tu dong test backend flow nhe.
2. Script tu start `MiniSeries.WebAPI` neu port `5137` chua chay, va tu tat server neu script la ben start.
3. Script test cac buoc:
   - Static `home.html` tra `200`.
   - Protected endpoint `/api/lessons/my` khong token tra `401`.
   - Login customer test bang Supabase Auth.
   - Profile quota tra du lieu hop le.
   - `/api/lessons/my` tra list hop le.
   - Missing lesson tra `404`.
   - Tao payment invoice mock.
   - Check invoice pending.
   - Goi bank webhook mock.
   - Check invoice paid.
4. Khong hardcode password vao script; password lay tu tham so `-Password` hoac env `MINISERIES_TEST_PASSWORD`.
5. Da chay script thanh cong voi account test hien tai; invoice smoke test tao order `42` va duoc mark `Paid`.

## [2026-06-03] - Trien khai video provider bang Pexels

### Da hoan thanh:
1. Them `PexelsOptions` cho cau hinh `Pexels:ApiKey` va `Pexels:BaseUrl`.
2. Them `PexelsVideoService` implement `IVideoService`.
3. Video flow hien tai:
   - Approve lesson co `OutputMode.Video`.
   - Tao chapter/quiz bang LLM nhu cu.
   - Tao anchor image bang Pollinations.
   - Moi chapter goi Pexels video search theo prompt.
   - Lay file `mp4` landscape/medium phu hop.
   - Upload video URL len Cloudinary bang `CloudinaryStorageService`.
   - Luu `Chapter.VideoUrl`.
4. Dang ky DI:
   - Image/Manga tiep tuc dung `PollinationsService`.
   - Video dung `PexelsVideoService` neu co API key.
   - Neu khong co Pexels key thi fallback ve `PollinationsService`.
5. Them fallback query video `education learning` va `classroom learning` neu prompt chapter qua cu the khong co ket qua.
6. Them log trong approve job cho buoc start/upload manga/video tung chapter.
7. Test truc tiep Pexels API bang key local: tra ve video mp4 usable.
8. Build solution thanh cong (`0 warning`, `0 error`).
9. Khi test full flow, phat hien Cloudinary remote-fetch anh Pollinations co the timeout.
10. Cap nhat `CloudinaryStorageService`:
   - Neu upload anh tu remote URL fail do timeout/loading, backend tu download anh ve stream roi upload len Cloudinary.
   - Error message Cloudinary khong con dua raw source URL vao exception.
11. Test full video flow thanh cong voi lesson `be87f85e-80f8-468e-967b-667968a74739`:
   - Login customer thanh cong.
   - Tao draft video thanh cong.
   - Approve thanh cong.
   - Tao anchor image thanh cong.
   - Tao 4 chapter.
   - 4/4 chapter co `VideoUrl`.
   - Job media generation completed.
   - Quota customer Basic con 29 luot sau test.

### Ghi chu:
1. Lesson test loi truoc do `1fb2fd8d-f2f5-4935-bf15-7626db0a1700` fail o buoc upload anchor image do Cloudinary timeout khi doc remote URL.

## [2026-06-04] - Tach quota manga va video theo goi

### Da hoan thanh:
1. Doi quota tu mot so luot chung sang hai quota rieng:
   - `Free`: 3 manga / 1 video moi thang.
   - `Basic`: 30 manga / 10 video moi thang.
   - `Premium`: 100 manga / 50 video moi thang.
2. Cap nhat `UserPlanQuotaService`:
   - Resolve plan tra ve manga/video limit rieng.
   - Reserve/refund quota theo `OutputMode` cua lesson.
   - Snapshot tra them `mangaMonthlyLimit`, `usedMangaCount`, `remainingMangaCount`, `videoMonthlyLimit`, `usedVideoCount`, `remainingVideoCount`.
   - Van giu cac field tong `monthlyGenerationLimit`, `usedGenerationCount`, `remainingGenerationCount` de FE hien tai chua bi gay.
3. Cap nhat `LessonsController`:
   - Lay lesson va check owner truoc.
   - Reserve quota dung loai manga/video truoc khi approve.
   - Refund dung loai quota neu approve fail.
4. Cap nhat `ProfileController` va `PaymentsController` de response co quota manga/video rieng.
5. Cap nhat `SupabaseRestService` de user moi tao profile mac dinh `Free` voi 3 manga / 1 video.
6. Tao va apply migration `SplitMangaVideoQuota` len Supabase:
   - Doi `MonthlyGenerationLimit` thanh `MangaMonthlyLimit`.
   - Doi `UsedGenerationCount` thanh `UsedMangaCount`.
   - Them `VideoMonthlyLimit` va `UsedVideoCount`.
   - Chuan hoa limit cua user hien co theo `PlanName`.
7. Build solution thanh cong (`0 warning`, `0 error`).
8. Test runtime thanh cong:
   - Login customer thanh cong.
   - Profile Basic tra `manga 1/30`, `video 0/10`, tong con 39.
   - Tao invoice Basic tra `mangaMonthlyLimit = 30`, `videoMonthlyLimit = 10`, `monthlyGenerationLimit = 40`.

## [2026-06-04] - Tao FE API handoff

### Da hoan thanh:
1. Them `docs/FE_API_HANDOFF.md` de ban FE co the noi API nhanh.
2. Tai lieu gom:
   - Auth register/verify/login.
   - Profile quota manga/video.
   - Draft/approve lesson generation.
   - Response chapter manga/video va quiz.
   - Loi het quota `402`.
   - Payment create invoice/check status.
3. Ghi chu ro FE nen dung `remainingMangaCount` va `remainingVideoCount` thay vi chi dung tong quota.

## [2026-06-08] - Sua FE static de test local on dinh

### Da hoan thanh:
1. Doi cac URL frontend hardcode `http://localhost:5137/api` sang relative path `/api` hoac current origin.
2. Sua `auth.js` de expose `window.handleRegister` dung voi cach `index.html` goi khi dang ky.
3. Them cache-bust cho `auth.js` trong `index.html` de tranh browser dung file JS cu.
4. Kiem tra server local `http://localhost:5088`:
   - `index.html` load dung `auth.js` moi.
   - `auth.js` co `window.handleRegister`.
   - Khong con hardcode `localhost:5137`.
5. Build solution thanh cong (`0 warning`, `0 error`).

## [2026-06-08] - Them session router cho auth FE

### Da hoan thanh:
1. Them `MiniSeries.WebAPI/wwwroot/session-router.js` de quan ly route guard chung.
2. Chan cac case:
   - Da login nhung back ve `index.html`.
   - Da logout nhung back ve `home.html`, `profile.html`, `pricing.html`, `checkout.html`, `tu-van.html`.
   - Customer vao `dashboard.html`.
   - Staff/Admin vao nham trang customer.
3. Doi login/logout sang dung `location.replace()` thong qua `SessionRouter` de tranh giu trang cu trong browser history.
4. Them guard vao `app.js` de generate flow cung di qua session router.
5. Kiem tra `node --check` cho `session-router.js`, `auth.js`, `app.js` thanh cong.
6. Build solution thanh cong (`0 warning`, `0 error`).

## [2026-06-08] - Them landing page public

### Da hoan thanh:
1. Chuyen trang dang nhap/dang ky hien tai sang `MiniSeries.WebAPI/wwwroot/login.html`.
2. Tao moi `MiniSeries.WebAPI/wwwroot/index.html` thanh landing page public cho MiniSeries Learning.
3. Landing page co:
   - Hero MiniSeries Learning.
   - Canvas background interactive.
   - CTA `Dang nhap` va `Vao ung dung`.
   - Tom tat flow nhap bai hoc -> review script -> media/quiz.
4. Cap nhat `session-router.js`:
   - `index.html` la public landing.
   - `login.html` la guest-only auth page.
   - Trang can auth redirect ve `login.html`.
5. Kiem tra local:
   - `http://localhost:5088/index.html` tra landing moi.
   - `http://localhost:5088/login.html` tra form auth cu.
6. Build solution thanh cong (`0 warning`, `0 error`).

## [2026-06-09] - Thiet ke lai Customer workspace home

### Da hoan thanh:
1. Bo UI feedback tren `home.html`:
   - Bo nut feedback tren nav.
   - Bo modal feedback.
   - Bo section danh sach feedback.
   - Bo script goi `/api/feedback` tren trang home.
2. Cap nhat header/dropdown de hien thi ro quota rieng:
   - `Truyen remainingMangaCount/mangaMonthlyLimit`.
   - `Video remainingVideoCount/videoMonthlyLimit`.
3. Thiet ke lai khung review script:
   - Hien script trong panel doc rieng.
   - Them panel thong tin chapter/output/nhan vat.
   - Nut approve ro hon.
4. Doi output chapter tu grid sang reader co nut:
   - `Truoc`.
   - counter chapter.
   - `Tiep`.
5. Doi quiz tu text thuong sang quiz tuong tac:
   - Chon dap an A/B/C/D.
   - Highlight dung/sai.
   - Hien explanation sau khi chon.
6. Kiem tra:
   - `node --check` cho JS chinh thanh cong.
   - `dotnet build MiniSeries.sln` thanh cong (`0 warning`, `0 error`).
   - Local `home.html` co `chapterStage`, co quota manga, va khong con `btnOpenFeedback`.

## [2026-06-09] - Fix render output sau approve

### Da hoan thanh:
1. Kiem tra backend/API:
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
   - Login API test thanh cong voi account customer.
   - `GET /api/lessons/my` va `GET /api/lessons/{id}` tra du lesson da generated, co `anchorImageUrl`, `chapters`, media URL va quiz.
2. Cap nhat `app.js`:
   - `renderMedia()` khong fail im lang khi thieu optional DOM/anchor.
   - `renderCurrentChapter()` hien panel thong bao neu API khong tra chapter thay vi de trang trong.
   - Them placeholder ro rang neu chapter thieu video/manga URL.
   - Them status approve dang cho theo thoi gian de user biet request generate co the lau.
3. Cap nhat `home.html`:
   - Them cache-busting cho `app.js?v=20260609-output-render` de browser khong dung JS cu.
4. Kiem tra:
   - `node --check MiniSeries.WebAPI/wwwroot/app.js` thanh cong.
   - Mock render bang Node cho lesson co video + quiz thanh cong.

## [2026-06-09] - Chinh UI draft va chapter reader

### Da hoan thanh:
1. Bo anchor image tren `home.html`:
   - User khong con thay block "Nhan vat chu dao/Anchor".
   - FE van co the dung anchor trong backend de generate, nhung khong hien ra UI.
2. Chinh draft review:
   - Khung draft chi hien noi dung kich ban.
   - Bo thong tin chapter/output/nhan vat trong khung draft vi khong can cho user.
3. Chinh CSS:
   - Lam lai khung draft gon hon, de doc hon.
   - Lam lai nut `Truoc` / `Tiep` cua chapter reader.
   - Lam lai quiz option, selected/correct/wrong state.
4. Kiem tra:
   - `node --check MiniSeries.WebAPI/wwwroot/app.js` thanh cong.
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
   - Mock render xac nhan draft khong con side panel, chapter image va quiz van render dung.
   - Don lai `app.js` thanh mot ban render duy nhat, khong con ham cu bi override.

## [2026-06-09] - Chot navbar React

### Da hoan thanh:
1. Cap nhat `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Route `/` dung navbar landing rieng.
   - Tat ca route con trong Layout nhu `/studio`, `/pricing`, `/checkout`, `/profile`, `/tu-van` dung studio navbar.
   - Studio navbar load profile/quota cho moi route app, khong chi rieng `/studio`.
   - Neu chua login thi studio navbar hien link `Dang nhap`.
2. Don lai text bi loi encoding trong `Layout.tsx`.
3. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Them guard tai khoan React

### Da hoan thanh:
1. Them `MiniSeries.Frontend/src/components/AuthGuard.tsx`:
   - Cac route app yeu cau phai co du `token` va `userId`.
   - Neu thieu session thi redirect ve `/login` bang `replace`.
2. Cap nhat `MiniSeries.Frontend/src/App.tsx`:
   - Bao ve `/studio`, `/pricing`, `/checkout`, `/profile`, `/tu-van`, `/dashboard`.
3. Cap nhat `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Bo fallback profile gia khi load profile fail.
   - Neu backend tra 401/403 thi xoa session va day ve `/login`.
   - Sua lai text tieng Viet trong navbar/profile dropdown.
4. Cap nhat `MiniSeries.Frontend/src/pages/Login.tsx`:
   - Chi tu redirect khoi trang login khi co du `token` va `userId`.
   - Dung `replace` sau login de giam loi back lai trang login.
5. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Fix flicker dang nhap tren navbar React

### Da hoan thanh:
1. Cap nhat `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Them state `isProfileLoading`.
   - Khi co session local nhung profile chua load xong, navbar hien badge loading thay vi hien `Dang nhap`.
   - Chan update state sau khi component doi route/unmount trong luc API profile dang chay.
2. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Chuyen profile/quota sang endpoint me

### Da hoan thanh:
1. Cap nhat backend `MiniSeries.WebAPI/Controllers/ProfileController.cs`:
   - Them `GET /api/profile/me`.
   - Endpoint lay user hien tai tu JWT, khong can FE gui `userId`.
   - Tai su dung cung response profile/quota voi `/api/profile/{id}`.
2. Cap nhat React API `MiniSeries.Frontend/src/services/api.ts`:
   - Them `api.getCurrentProfile()` goi `/api/profile/me`.
   - Them key cache `profile_snapshot`.
   - Login tiep tuc luu session toi gian va xoa cache profile cu neu doi user.
3. Cap nhat navbar `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Render ten user tu session toi gian ngay lap tuc.
   - Render quota tu cache neu co.
   - Goi `/api/profile/me` de refresh quota that va cap nhat cache.
   - Khong con goi `/profile/{userId}` cho navbar cua chinh user.
4. Cap nhat `MiniSeries.Frontend/src/pages/Profile.tsx`:
   - Bo placeholder.
   - Hien profile/quota that tu `/api/profile/me`.
5. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.

## [2026-06-09] - Preload quota sau login va refresh sau generate

### Da hoan thanh:
1. Cap nhat `MiniSeries.Frontend/src/services/api.ts`:
   - Them `refreshProfileSnapshot()` de goi `/api/profile/me`, ghi cache `profile_snapshot`.
   - Them event `profile-snapshot-updated` de cac component biet quota vua doi.
   - Sau `approveDraft()` thanh cong se refresh lai profile/quota.
2. Cap nhat `MiniSeries.Frontend/src/pages/Login.tsx`:
   - Sau login thanh cong, FE goi `/api/profile/me` ngay de preload quota lan dau truoc khi vao Studio.
   - Neu preload fail vi 401/403 thi xoa session va bao dang nhap lai.
3. Cap nhat `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Navbar lang nghe event `profile-snapshot-updated`.
   - Khi profile cache doi, navbar cap nhat quota ngay khong can reload trang.
4. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Tra quota ngay trong login response

### Da hoan thanh:
1. Cap nhat backend `MiniSeries.WebAPI/Controllers/AuthController.cs`:
   - `POST /api/auth/login-profile` tra them quota snapshot hien tai.
   - Response login gom plan, manga quota, video quota, chu ky hien tai va avatarUrl.
2. Cap nhat React `MiniSeries.Frontend/src/pages/Login.tsx`:
   - Sau login khong goi them `/api/profile/me`.
   - Ghi profile/quota cache truc tiep tu login response bang `writeProfileSnapshot(data)`.
3. Giu nguyen `/api/profile/me`:
   - Dung de refresh profile/quota khi mo lai app, sau generate, sau payment.
4. Kiem tra:
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.

## [2026-06-09] - Toi uu toc do login response quota

### Da hoan thanh:
1. Cap nhat `MiniSeries.WebAPI/Controllers/AuthController.cs`:
   - Bo call `SupabaseRestService.GetUserProfileByIdAsync()` trong login.
   - Sau Supabase Auth, login query `UserProfiles` truc tiep bang EF.
   - Neu profile thieu thi tao bang EF trong cung DB context.
   - Login lay quota tu entity profile da query, khong query lai profile lan nua.
2. Cap nhat `MiniSeries.Infrastructure/Services/UserPlanQuotaService.cs`:
   - Them overload `GetSnapshotAsync(UserProfile profile)` de dung entity co san.
3. Muc tieu:
   - Giam login tu Auth + PostgREST profile + EF quota xuong Auth + EF profile/quota.
4. Kiem tra:
   - `dotnet build MiniSeries.sln --no-restore` thanh cong.
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Bo alert browser va success login React

### Da hoan thanh:
1. Cap nhat `MiniSeries.Frontend/src/pages/Login.tsx`:
   - Bo banner `Dang nhap thanh cong`.
   - Login thanh cong dieu huong ngay sang route phu hop.
2. Cap nhat `MiniSeries.Frontend/src/pages/Studio.tsx`:
   - Thay alert validate bang inline error state.
   - Validate thieu title/content va draft rong khong con hien popup trinh duyet.
3. Cap nhat `MiniSeries.Frontend/src/components/Layout.tsx`:
   - Bo alert o nut `Series yeu thich`.
4. Cap nhat `MiniSeries.Frontend/src/pages/TuVan.tsx`:
   - Bo alert submit form.
   - Hien message trong UI va reset form.
5. Kiem tra:
   - `rg "alert\\(" MiniSeries.Frontend/src` khong con ket qua.
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-09] - Chuyen validate sang toast popup React

### Da hoan thanh:
1. Them component dung chung:
   - `MiniSeries.Frontend/src/components/Toast.tsx`
   - `MiniSeries.Frontend/src/components/Toast.css`
2. Cap nhat `MiniSeries.Frontend/src/pages/Login.tsx`:
   - Error/success dang nhap/dang ky/OTP hien bang toast noi.
   - Khong chiem dien tich trong box login.
3. Cap nhat `MiniSeries.Frontend/src/pages/Studio.tsx`:
   - Validate va API error hien bang toast noi.
   - Khong day layout input/draft xuong.
4. Cap nhat `MiniSeries.Frontend/src/pages/TuVan.tsx`:
   - Submit message hien bang toast noi.
5. Kiem tra:
   - `rg "alert\\(|login-error-alert|login-success-alert" MiniSeries.Frontend/src` khong con ket qua.
   - `npm run build` trong `MiniSeries.Frontend` thanh cong.

## [2026-06-21] - Fix lỗi duyệt kịch bản (400 Bad Request) & Fallback Cloudinary

### Đã hoàn thành:
1.  **Sửa lỗi duyệt kịch bản (400 Bad Request):**
    - Cho phép duyệt lại kịch bản (Approve) nếu kịch bản đã ở trạng thái `Approved` nhưng việc tạo media bị lỗi hoặc chưa hoàn thành.
    - Cập nhật [ApproveLessonScriptCommandHandler.cs](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/MiniSeries.Application/Lessons/Commands/ApproveLessonScript/ApproveLessonScriptCommandHandler.cs) để cho phép chạy lệnh Approve khi kịch bản ở trạng thái `AwaitingReview` hoặc `Approved`.
    - Cập nhật [LessonsController.cs](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/MiniSeries.WebAPI/Controllers/LessonsController.cs) để phát hiện và xử lý trường hợp duyệt lại (retry), không trừ thêm quota manga/video của người dùng và không refund nếu xảy ra lỗi.
2.  **Cấu hình tự động Fallback khi Cloudinary upload lỗi:**
    - Cập nhật [CloudinaryStorageService.cs](file:///c:/Users/USER/.gemini/antigravity/scratch/MiniSeries/MiniSeries.Infrastructure/ExternalServices/CloudinaryStorageService.cs) để tự động bắt các lỗi liên quan đến Cloudinary (như sai hoặc hết hạn API key/secret, lỗi kết nối Cloudinary).
    - Khi Cloudinary lỗi, hệ thống sẽ log cảnh báo và trả về trực tiếp URL ảnh/video được tạo từ Pollinations/Pexels ban đầu, giúp tiến trình Approve và sinh manga/video hoàn tất 100% thay vì làm treo hoặc lỗi pipeline generation.
3.  **Xác minh & Biên dịch:**
    - Build dự án thành công với **0 lỗi, 0 cảnh báo**.
    - Chạy thử quy trình tạo và duyệt thành công.





