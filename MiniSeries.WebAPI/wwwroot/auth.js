const API_BASE_URL = 'http://localhost:5137';

async function parseResponseSafe(response) {
    const text = await response.text();
    if (!text) {
        return { message: `Máy chủ trả về rỗng (HTTP ${response.status}).` };
    }
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

/** Chỉ lấy message từ backend — không gán thông báo mặc định sai lệch. */
function getApiErrorMessage(response, data) {
    if (!data) return `Lỗi HTTP ${response.status}`;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data.message) return String(data.message);
    if (data.error_description) return String(data.error_description);
    if (data.msg) return String(data.msg);
    if (data.title) return String(data.title);
    if (Array.isArray(data.errors)) {
        const parts = data.errors.map((e) => e?.message || JSON.stringify(e)).filter(Boolean);
        if (parts.length) return parts.join('; ');
    }
    return `Lỗi HTTP ${response.status}`;
}

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

let tempRegisterData = null;

function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

function redirectAfterLogin(targetPage) {
    const currentUrl = window.location.href;
    if (currentUrl.includes('index.html')) {
        window.location.href = currentUrl.replace('index.html', targetPage);
        return;
    }
    if (currentUrl.includes('pricing.html')) {
        window.location.href = currentUrl.replace('pricing.html', targetPage);
        return;
    }
    if (currentUrl.includes('login.html')) {
        window.location.href = currentUrl.replace('login.html', targetPage);
        return;
    }
    window.location.href = targetPage;
}

function saveSessionFromAuth(data) {
    const userId = data.userId ?? data.id ?? data.Id;
    const role = data.role ?? data.Role ?? 'Customer';
    if (!userId) {
        throw new Error('Backend không trả về userId.');
    }
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', role);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', data.fullName ?? data.FullName ?? 'User');
    localStorage.setItem('user_email', data.email ?? data.Email ?? '');
    if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
    }
}

// Giai đoạn 1: Gửi OTP qua Gmail (chưa tạo Supabase Auth)
document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const fullName = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    if (!fullName || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    if (password.length < 6) {
        alert('Mật khẩu tối thiểu 6 ký tự.');
        return;
    }

    const uniqueUserId = generateUUID();
    const payload = {
        supabaseUserId: uniqueUserId,
        email,
        fullName,
        password,
        role: 'Customer'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resData = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, resData));
        }

        tempRegisterData = { userId: uniqueUserId, fullName, email, password };

        registerFormSection.innerHTML = `
            <div class="space-y-4">
                <div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                    <p class="text-sm text-purple-400">${resData.message || 'Mã OTP đã được gửi! Kiểm tra hộp thư email của bạn.'}</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nhập mã xác nhận (OTP)</label>
                    <input type="text" id="otpInput" maxlength="6" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-center text-2xl font-bold tracking-widest text-white transition" placeholder="000000">
                </div>
                <button id="verifyOtpBtn" type="button" class="w-full py-3 mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex justify-center items-center">
                    Xác nhận kích hoạt
                </button>
            </div>
        `;
        formSubtitle.innerText = 'Xác thực Email tài khoản';
        document.getElementById('verifyOtpBtn').addEventListener('click', handleVerifyOtp);
    } catch (err) {
        alert('Lỗi đăng ký: ' + (err.message || 'Không xác định'));
    }
});

// Giai đoạn 2: Xác thực OTP → Backend tạo Supabase Auth + UserProfiles
async function handleVerifyOtp() {
    const otpCode = document.getElementById('otpInput')?.value.trim() || '';
    if (otpCode.length !== 6) {
        alert('Vui lòng nhập đủ mã xác nhận gồm 6 chữ số!');
        return;
    }
    if (!tempRegisterData) {
        alert('Phiên đăng ký không hợp lệ. Vui lòng tải lại trang và đăng ký lại.');
        return;
    }

    const payload = {
        supabaseUserId: tempRegisterData.userId,
        email: tempRegisterData.email,
        fullName: tempRegisterData.fullName,
        otpCode
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resData = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, resData));
        }

        alert(resData.message || 'Xác thực hoàn tất! Bạn có thể đăng nhập.');
        window.location.reload();
    } catch (err) {
        alert('Lỗi xác thực: ' + (err.message || 'Không xác định'));
    }
}

async function handleLogin(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanEmail || !cleanPassword) {
        alert('Vui lòng điền đầy đủ Email và Mật khẩu!');
        return;
    }

    const payload = { email: cleanEmail, password: cleanPassword };

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, data));
        }

        saveSessionFromAuth(data);

        const role = data.role ?? data.Role ?? 'Customer';
        const targetPage = role === 'Admin' || role === 'Staff' ? 'dashboard.html' : 'home.html';
        redirectAfterLogin(targetPage);
    } catch (err) {
        alert('Đăng nhập thất bại: ' + (err.message || 'Không xác định'));
    }
}

window.handleLogin = handleLogin;
