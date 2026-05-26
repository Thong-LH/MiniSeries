const API_BASE_URL = 'http://localhost:5137';

// Hàm đọc response JSON an toàn tuyệt đối, không lo sập luồng dữ liệu (Stream)
async function parseResponseSafe(response) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : { message: "Không có phản hồi từ hệ thống." };
    } catch (e) {
        return { message: "Lỗi cấu trúc dữ liệu mạng." };
    }
}

// Chuyển đổi qua lại giữa Form Login và Register
const loginFormSection = document.getElementById('loginFormSection');
const registerFormSection = document.getElementById('registerFormSection');
const formSubtitle = document.getElementById('formSubtitle');

document.getElementById('toRegisterLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormSection.classList.add('hidden');
    registerFormSection.classList.remove('hidden');
    formSubtitle.innerText = 'Đăng ký tài khoản mới để trải nghiệm dịch vụ';
});

document.getElementById('toLoginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    registerFormSection.classList.add('hidden');
    loginFormSection.classList.remove('hidden');
    formSubtitle.innerText = 'Đăng nhập để bắt đầu chuyển đổi bài học';
});

// BIẾN LƯU TRỮ TẠM THỜI THÔNG TIN ĐĂNG KÝ TRÊN CLIENT
let tempRegisterData = null;

// Hàm tự động tạo chuỗi GUID ngẫu nhiên chuẩn RFC4122 trên trình duyệt
function generateUUID() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// XỬ LÝ BẤM NÚT ĐĂNG KÝ (Giai đoạn 1: Sinh ID duy nhất và gửi yêu cầu OTP)
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const fullName = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if (!fullName || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    try {
        const uniqueUserId = generateUUID();

        const response = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                supabaseUserId: uniqueUserId,
                email: email,
                fullName: fullName,
                password: password // Đã thêm trường password đồng bộ chính xác với RegisterProfileDto mới
            })
        });

        const resData = await parseResponseSafe(response);

        if (!response.ok) {
            throw new Error(resData.message || 'Không thể tiến hành đăng ký.');
        }

        tempRegisterData = { userId: uniqueUserId, fullName, email };

        // Thay đổi giao diện sang màn hình nhập OTP kích hoạt
        registerFormSection.innerHTML = `
            <div class="space-y-4">
                <div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                    <p class="text-sm text-purple-400">Mã OTP đã được gửi! Hãy kiểm tra Email (hoặc màn hình Terminal của Backend) để lấy mã!</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nhập mã xác nhận (OTP)</label>
                    <input type="text" id="otpInput" maxlength="6" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-center text-2xl font-bold tracking-widest text-white transition" placeholder="000000">
                </div>
                <button id="verifyOtpBtn" class="w-full py-3 mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex justify-center items-center">
                    Xác nhận kích hoạt
                </button>
            </div>
        `;
        formSubtitle.innerText = 'Xác thực Email tài khoản';

        document.getElementById('verifyOtpBtn').addEventListener('click', handleVerifyOtp);

    } catch (err) {
        alert('Lỗi đăng ký: ' + err.message);
    }
});

// XỬ LÝ XÁC THỰC OTP (Giai đoạn 2)
async function handleVerifyOtp() {
    const otpCode = document.getElementById('otpInput').value.trim();
    if (otpCode.length !== 6) {
        alert('Vui lòng nhập đủ mã xác nhận gồm 6 chữ số!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                supabaseUserId: tempRegisterData.userId,
                email: tempRegisterData.email,
                fullName: tempRegisterData.fullName,
                otpCode: otpCode
            })
        });

        const resData = await parseResponseSafe(response);

        if (!response.ok) {
            throw new Error(resData.message || 'Mã xác thực không chính xác.');
        }

        alert('Xác thực hoàn tất! Hồ sơ của bạn đã được kích hoạt đàng hoàng.');
        window.location.reload(); // Reload để quay về màn hình đăng nhập sạch sẽ
    } catch (err) {
        alert('Lỗi xác thực: ' + err.message);
    }
}

// XỬ LÝ ĐĂNG NHẬP (Gửi Email + Password lên .NET)
document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert('Vui lòng điền đầy đủ Email và Mật khẩu!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await parseResponseSafe(response);

        if (!response.ok) {
            throw new Error(data.message || 'Tài khoản không tồn tại hoặc mật khẩu chưa đúng.');
        }

        // Đọc ID an toàn từ dữ liệu Backend trả về
        const userId = data.userId ?? data.id ?? data.Id;
        if (!userId) {
            throw new Error("Backend trả về dữ liệu rỗng, không tìm thấy UserId.");
        }

        // Lưu thông tin phiên đăng nhập vào LocalStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('user_role', data.role ?? data.Role ?? 'Customer');
        localStorage.setItem('user_name', data.fullName ?? data.FullName ?? 'User');

        // ===================================================================================
        // LOGIC ĐIỀU HƯỚNG MỚI: ĐẨY THẲNG VỀ TRANG HOME.HTML CHỨA CHỨC NĂNG CHÍNH GEN AI
        // ===================================================================================
        const currentUrl = window.location.href;
        
        if (currentUrl.includes('index.html')) {
            window.location.href = currentUrl.replace('index.html', 'home.html');
        } else if (currentUrl.includes('pricing.html')) {
            window.location.href = currentUrl.replace('pricing.html', 'home.html');
        } else if (currentUrl.includes('login.html')) {
            window.location.href = currentUrl.replace('login.html', 'home.html');
        } else {
            // Trường hợp chạy URL gốc (ví dụ: http://localhost:5500/) thì nối đuôi home.html vào
            // Đảm bảo không bị mất dấu gạch chéo cuối URL nếu có
            const baseUrl = currentUrl.endsWith('/') ? currentUrl : currentUrl + '/';
            window.location.href = baseUrl + 'home.html';
        }
        // ===================================================================================

    } catch (err) {
        alert('Đăng nhập thất bại: ' + err.message);
    }
});