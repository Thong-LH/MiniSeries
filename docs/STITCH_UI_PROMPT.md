# PROMPT THIẾT KẾ GIAO DIỆN APP MOBILE (GOOGLE STITCH / GOOGLE AI)

Dưới đây là Prompt thiết kế chi tiết bằng tiếng Anh (ngôn ngữ tối ưu nhất cho các AI thiết kế và tạo code UI như Google Stitch, Claude Artifacts, v.v.). Bạn có thể copy toàn bộ nội dung dưới đây để đưa vào AI.

---

```text
Act as an expert mobile UI/UX designer and frontend engineer. Generate a modern, premium, high-fidelity React Native (Expo) layout proposal for a mobile application named "MiniSeries" (an AI-powered educational manga and short video generation platform). 

### Design System & Theme Settings:
- Theme: Sleek Dark Mode (Primary background: slate-950 #020617, Card background: slate-900 with 60% opacity for glassmorphism).
- Brand Colors: Sky Blue (#38bdf8) as primary accent, Royal Blue (#3b82f6) for gradients, Emerald Green (#10b981) for success/quotas, Rose Red (#f43f5e) for warnings/errors.
- Typography: Modern, clean sans-serif (Inter or Outfit), highly readable on mobile.
- Aesthetic: Glassmorphism, card borders with low opacity sky-blue overlay (rgba(56, 189, 248, 0.2)), rounded corners (border-radius: 16px), subtle inner shadows, and soft neon glow effects.

Please generate the visual layout, screen components, and structure for the following 6 core screens, styled precisely for mobile dimensions (portrait view, e.g., iPhone 15 size 390x844px).

---

### SCREEN 1: Authentication (Login, Register & OTP Verification)
1. Header: A glowing brand logo (stylized Manga speech bubble with a play icon inside) and "MiniSeries" title in sky-blue gradient text.
2. Forms (Toggle between Login/Register tabs):
   - Input fields: Fully rounded corners (12px), semi-transparent dark background, thin slate border, placeholder text in slate-500. When active, the border glows sky-blue.
   - Buttons: A prominent primary button with a gradient background (Royal Blue to Sky Blue), white bold text, and a soft shadow.
3. OTP Verification Overlay / State:
   - Screen showing an email envelope graphic, stating "Enter the 6-digit verification code sent to your email".
   - 6 individual square input boxes arranged in a row (focused box highlights in sky-blue).
   - "Resend Code" link with a 60-second countdown timer.

---

### SCREEN 2: Home Dashboard (Lesson History List)
1. Header: Welcome message "Xin chào, [User Name]" with a circular futuristic avatar (robot head outline) and a "Basic Plan" tier badge next to it.
2. Search & Filter: A search bar with a glassmorphism search icon, followed by filter chips (All, Manga, Video, In Progress).
3. Lesson Cards (Grid Layout):
   - Each card represents a generated lesson.
   - Background: The lesson's cover art (anchor image) with a dark gradient overlay at the bottom so white title text is readable.
   - Floating badge on card: Speach bubble icon for Manga mode, Play icon for Video mode.
   - Status indicators: "Đang tạo..." (spinning loader), "Chờ duyệt kịch bản" (yellow warning badge), or "Hoàn thành" (green checkmark badge).
   - Support Pull-to-refresh animation at the top.

---

### SCREEN 3: Create Lesson Studio
1. Header: "Tạo bài học mới" with a back button.
2. Form fields:
   - "Tiêu đề bài học" (Input box: e.g., "Vòng tuần hoàn của nước").
   - "Nội dung bài học" (Textarea: placeholder "Nhập hoặc dán tài liệu học tập thô tại đây...").
3. Format Selector:
   - A modern segmented control switch: [ Manga Mode ] vs [ Short Video Mode ] with clear icons.
4. Creative Mode Toggle:
   - A toggle switch labeled "Chế độ định hướng (Guided Mode)".
   - When toggled ON, an input area labeled "Ý tưởng kịch bản (Creative Brief)" slides down smoothly with a placeholder "Nhập yêu cầu cụ thể của bạn cho kịch bản...".
5. Submit Button: A large sticky button at the bottom labeled "Tạo kịch bản nháp" with a glowing hover effect.

---

### SCREEN 4: Draft Script Review & Approve
1. Title: "Duyệt kịch bản nháp" showing the lesson draft title.
2. Tab switcher: "Tổng quan kịch bản" vs "Tạo hình nhân vật".
3. Script details card:
   - Scrollable container displaying the character visual description ("Character Profile") and the overall narrative script outline ("Overall Script") in clean Vietnamese markdown.
4. Sticky Action Bar:
   - Left button: "Hủy bỏ" (danger red border, transparent background).
   - Right button: "Phê duyệt & Tạo thành phẩm" (gradient primary button with a coins/tokens cost indicator, e.g., "Tiêu hao 1 Token").
5. Realtime Generation Status (Modal overlay when Approve is clicked):
   - Fullscreen dark blur.
   - Circular progress ring showing 0% to 100%.
   - Active step indicator text sequence: "1. Chia chương kịch bản..." -> "2. Phác thảo nhân vật..." -> "3. Vẽ tranh Manga / Tạo Video..." -> "4. Tải lên kho lưu trữ...".

---

### SCREEN 5: Manga Reader / Video Player & Interactive Quiz
1. Immersive player container at the top:
   - IF Manga Mode: A vertical webtoon-style viewer displaying continuous manga panels with speech bubbles. Double-tap toggles full screen.
   - IF Video Mode: A custom styled HTML5/React Native video player showing a playback slider, play/pause controls, time stamps, and full-screen controls.
2. Interactive Quiz Section (Placed at the bottom / after lesson media):
   - A Card titled "Kiểm tra kiến thức".
   - Question text: e.g., "Lực nào giữ Trái Đất quay quanh Mặt Trời?"
   - 4 Option buttons: Large rectangular slate buttons. 
     - Tapping an option displays a choice highlight.
     - On answer submission: The correct option turns green (#10b981) with a checkmark; if the user picked the wrong option, it turns red (#f43f5e) with an X mark.
     - An explanation container ("Giải thích đáp án") slides open at the bottom showing educational notes.

---

### SCREEN 6: User Profile & Pricing Packages
1. User Header: Display name, email, avatar, and join date.
2. Quota Tracker Grid:
   - Two circular progress indicators side-by-side:
     - Left: "Manga Token" displaying "Còn lại: 29 / 30" (96% full, green ring).
     - Right: "Video Token" displaying "Còn lại: 10 / 10" (100% full, blue ring).
3. Subscription Plans (Vertical Cards list):
   - Free Plan, Basic Plan (10,000đ/month), Premium Plan (50,000đ/month).
   - Each card lists: Price, token limits, key benefits, and a button to upgrade.
4. Payment Invoice Modal:
   - Displays a QR Code for banking transfer.
   - Details: Bank name, Account number, Account owner, Amount, and Transfer Content (e.g. "MGX-123").
   - A counting down timer (15:00 minutes).
   - A primary confirmation button: "Tôi đã chuyển khoản".
```
