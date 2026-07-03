# TÀI LIỆU THIẾT KẾ API - MINISERIES MOBILE APP

Tài liệu này mô tả chi tiết các cổng API (Endpoints) cần thiết phục vụ cho việc kết nối giữa ứng dụng Mobile (`MiniSeries.Mobile`) và hệ thống Backend trong Sprint 4.

---

## 1. HỆ THỐNG XÁC THỰC (AUTHENTICATION API)

### 1.1 Yêu cầu gửi mã OTP
* **Endpoint**: `POST /api/auth/send-otp`
* **Content-Type**: `application/json`
* **Request Body**:
```json
{
  "phoneNumber": "0987654321"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Mã OTP đã được gửi tới số điện thoại của bạn."
}
```

### 1.2 Xác nhận mã OTP để đăng nhập
* **Endpoint**: `POST /api/auth/verify-otp`
* **Request Body**:
```json
{
  "phoneNumber": "0987654321",
  "otpCode": "123456"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_902183",
    "name": "Lê Hồng Thông",
    "email": "thonglhse182025@fpt.edu.vn",
    "activePlan": "Basic"
  }
}
```

---

## 2. QUẢN LÝ BÀI HỌC (LESSONS API)

### 2.1 Lấy danh sách bài học
* **Endpoint**: `GET /api/lessons`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
[
  {
    "id": "lesson-1",
    "title": "Introduction to Manga Pacing & Flow",
    "type": "manga",
    "duration": "45 min",
    "status": "Hoàn thành",
    "progress": 100,
    "coverUrl": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600",
    "description": "Học cách thiết kế khung hình manga để tạo nhịp điệu đọc lôi cuốn."
  }
]
```

### 2.2 Lấy chi tiết bài học (Xem truyện / Video)
* **Endpoint**: `GET /api/lessons/{id}`
* **Response (200 OK)**:
```json
{
  "id": "lesson-1",
  "title": "Introduction to Manga Pacing & Flow",
  "type": "manga",
  "panels": [
    {
      "id": 1,
      "title": "Khung 1: Khởi đầu",
      "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      "bubble": "Hãy bắt đầu phân tách dữ liệu thành từng mảnh nhỏ nào!",
      "bubblePosition": "right"
    }
  ],
  "quiz": [
    {
      "question": "IP Address nằm ở tầng nào trong mô hình OSI?",
      "options": [
        "Tầng Vật lý (Physical)",
        "Tầng Liên kết dữ liệu (Data Link)",
        "Tầng Mạng (Network)",
        "Tầng Vận chuyển (Transport)"
      ],
      "correctAnswer": 2,
      "explanation": "Địa chỉ IP là giao thức lớp Network (Lớp 3) trong mô hình OSI."
    }
  ]
}
```

### 2.3 Gửi kết quả trắc nghiệm và tiến độ học
* **Endpoint**: `POST /api/lessons/{id}/progress`
* **Request Body**:
```json
{
  "progress": 100,
  "score": 10,
  "answers": [2]
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Tiến độ học tập đã được lưu trữ thành công."
}
```

---

## 3. STUDIO SÁNG TẠO AI (AI GENERATOR API)

### 3.1 Khởi tạo sinh bài học bằng AI
* **Endpoint**: `POST /api/lessons/generate`
* **Request Body**:
```json
{
  "title": "Lập trình hướng đối tượng là gì",
  "content": "Context tài liệu tham khảo...",
  "format": "manga",
  "guidedMode": true
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "draftLessonId": "draft_873102",
  "message": "Tiến trình khởi tạo AI đã được kích hoạt."
}
```

### 3.2 Lắng nghe tiến độ sinh kịch bản (Polling)
* **Endpoint**: `GET /api/lessons/generate/{draftLessonId}/progress`
* **Response (200 OK)**:
```json
{
  "draftLessonId": "draft_873102",
  "progressPercent": 45,
  "status": "AI đang soạn thảo kịch bản chi tiết...",
  "isCompleted": false
}
```

---

## 4. PHÊ DUYỆT KỊCH BẢN NHÁP (DRAFT SCRIPT API)

### 4.1 Lấy kịch bản phân cảnh chi tiết để duyệt
* **Endpoint**: `GET /api/lessons/draft/{draftLessonId}`
* **Response (200 OK)**:
```json
{
  "draftLessonId": "draft_873102",
  "title": "Lập trình hướng đối tượng là gì",
  "format": "manga",
  "scenes": [
    {
      "number": 1,
      "title": "Bối cảnh nhập môn",
      "duration": "10s",
      "visual": "Mô tả hình vẽ...",
      "narrator": "Giọng thuyết minh...",
      "action": "Hành động nhân vật..."
    }
  ]
}
```

### 4.2 Phê duyệt kịch bản và trừ token để xuất bản
* **Endpoint**: `POST /api/lessons/draft/{draftLessonId}/approve`
* **Response (200 OK)**:
```json
{
  "success": true,
  "newLessonId": "lesson-999",
  "remainingTokens": {
    "mangaTokens": 29,
    "videoTokens": 30
  }
}
```

### 4.3 Hủy bỏ kịch bản nháp
* **Endpoint**: `DELETE /api/lessons/draft/{draftLessonId}`
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Kịch bản nháp đã bị xóa bỏ."
}
```

---

## 5. HỆ THỐNG GÓI CƯỚC & THANH TOÁN (BILLING API)

### 5.1 Tạo hóa đơn thanh toán QR động
* **Endpoint**: `POST /api/billing/create-invoice`
* **Request Body**:
```json
{
  "planName": "Basic",
  "amount": 10000
}
```
* **Response (200 OK)**:
```json
{
  "invoiceId": "inv_882910",
  "qrImageUrl": "https://api.vietqr.io/image/MB/0987654321/10000/miniseries_inv_882910.jpg",
  "expireInSeconds": 900
}
```

### 5.2 Lắng nghe trạng thái hóa đơn (Polling)
* **Endpoint**: `GET /api/billing/invoice/{invoiceId}/status`
* **Response (200 OK)**:
```json
{
  "invoiceId": "inv_882910",
  "status": "PAID", 
  "message": "Thanh toán thành công. Tài khoản đã được nâng cấp!"
}
```
