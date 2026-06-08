const API_BASE_URL = window.location.origin;

let tempRegisterData = null;

function setFormMode(mode) {
    const loginFormSection = document.getElementById("loginFormSection");
    const registerFormSection = document.getElementById("registerFormSection");
    const formSubtitle = document.getElementById("formSubtitle");

    if (!loginFormSection || !registerFormSection || !formSubtitle) return;

    if (mode === "register") {
        loginFormSection.classList.add("hidden");
        registerFormSection.classList.remove("hidden");
        formSubtitle.innerText = "Dang ky tai khoan moi de trai nghiem he thong";
        return;
    }

    registerFormSection.classList.add("hidden");
    loginFormSection.classList.remove("hidden");
    formSubtitle.innerText = "Dang nhap de bat dau chuyen doi bai hoc";
}

function setButtonLoading(button, isLoading, loadingText) {
    if (!button) return;

    if (isLoading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.innerHTML;
        }
        button.disabled = true;
        button.classList.add("opacity-70", "cursor-not-allowed");
        button.innerHTML = loadingText;
        return;
    }

    button.disabled = false;
    button.classList.remove("opacity-70", "cursor-not-allowed");
    if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
    }
}

async function parseResponseSafe(response) {
    const text = await response.text();
    if (!text) {
        return { message: `May chu tra ve rong (HTTP ${response.status}).` };
    }

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function getApiErrorMessage(response, data) {
    if (!data) return `Loi HTTP ${response.status}`;
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data.message) return String(data.message);
    if (data.error_description) return String(data.error_description);
    if (data.msg) return String(data.msg);
    if (data.title) return String(data.title);
    if (Array.isArray(data.errors)) {
        const parts = data.errors
            .map((error) => error?.message || JSON.stringify(error))
            .filter(Boolean);
        if (parts.length) return parts.join("; ");
    }
    return `Loi HTTP ${response.status}`;
}

function generateUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (char) =>
        (char ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (char / 4)))).toString(16)
    );
}

function redirectAfterLogin(targetPage) {
    if (window.SessionRouter) {
        window.SessionRouter.redirectAfterLogin(localStorage.getItem("userRole") || localStorage.getItem("user_role"));
        return;
    }

    const currentUrl = window.location.href;
    for (const page of ["index.html", "pricing.html", "login.html"]) {
        if (currentUrl.includes(page)) {
            window.location.replace(currentUrl.replace(page, targetPage));
            return;
        }
    }
    window.location.replace(targetPage);
}

function saveSessionFromAuth(data) {
    const userId = data.userId ?? data.id ?? data.Id;
    const role = data.role ?? data.Role ?? "Customer";

    if (!userId) {
        throw new Error("Backend khong tra ve userId.");
    }

    localStorage.setItem("userId", userId);
    localStorage.setItem("userRole", role);
    localStorage.setItem("user_role", role);
    localStorage.setItem("user_name", data.fullName ?? data.FullName ?? "User");
    localStorage.setItem("user_email", data.email ?? data.Email ?? "");

    if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
    }
}

async function handleRegister(email, password, fullName) {
    const registerButton = document.getElementById("registerBtn");
    const registerFormSection = document.getElementById("registerFormSection");
    const formSubtitle = document.getElementById("formSubtitle");

    const cleanFullName = (fullName || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
        alert("Vui long dien day du thong tin.");
        return;
    }

    if (cleanPassword.length < 6) {
        alert("Mat khau toi thieu 6 ky tu.");
        return;
    }

    const userId = generateUUID();
    const payload = {
        supabaseUserId: userId,
        email: cleanEmail,
        fullName: cleanFullName,
        password: cleanPassword,
        role: "Customer"
    };

    try {
        setButtonLoading(registerButton, true, "Dang gui ma OTP...");

        const response = await fetch(`${API_BASE_URL}/api/auth/register-profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, data));
        }

        tempRegisterData = {
            userId,
            fullName: cleanFullName,
            email: cleanEmail,
            password: cleanPassword
        };

        if (registerFormSection) {
            registerFormSection.innerHTML = `
                <div class="space-y-4">
                    <div class="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
                        <p class="text-sm text-purple-400">${data.message || "Ma OTP da duoc gui. Kiem tra email cua ban."}</p>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nhap ma xac nhan OTP</label>
                        <input type="text" id="otpInput" maxlength="6" class="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-center text-2xl font-bold tracking-widest text-white transition" placeholder="000000">
                    </div>
                    <button id="verifyOtpBtn" type="button" class="w-full py-3 mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition shadow-lg flex justify-center items-center">
                        Xac nhan kich hoat
                    </button>
                </div>
            `;
        }

        if (formSubtitle) {
            formSubtitle.innerText = "Xac thuc Email tai khoan";
        }

        document.getElementById("verifyOtpBtn")?.addEventListener("click", handleVerifyOtp);
    } catch (error) {
        alert("Loi dang ky: " + (error.message || "Khong xac dinh"));
        setButtonLoading(registerButton, false);
    }
}

async function handleVerifyOtp() {
    const verifyButton = document.getElementById("verifyOtpBtn");
    const otpCode = document.getElementById("otpInput")?.value.trim() || "";

    if (otpCode.length !== 6) {
        alert("Vui long nhap du ma xac nhan gom 6 chu so.");
        return;
    }

    if (!tempRegisterData) {
        alert("Phien dang ky khong hop le. Vui long tai lai trang va dang ky lai.");
        return;
    }

    const payload = {
        supabaseUserId: tempRegisterData.userId,
        email: tempRegisterData.email,
        fullName: tempRegisterData.fullName,
        otpCode
    };

    try {
        setButtonLoading(verifyButton, true, "Dang xac thuc...");

        const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, data));
        }

        alert(data.message || "Xac thuc hoan tat. Ban co the dang nhap.");
        window.location.reload();
    } catch (error) {
        alert("Loi xac thuc: " + (error.message || "Khong xac dinh"));
        setButtonLoading(verifyButton, false);
    }
}

async function handleLogin(email, password) {
    const loginButton = document.getElementById("loginBtn");
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";

    if (!cleanEmail || !cleanPassword) {
        alert("Vui long dien day du Email va Mat khau.");
        return;
    }

    try {
        setButtonLoading(loginButton, true, "Dang dang nhap...");

        const response = await fetch(`${API_BASE_URL}/api/auth/login-profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        });

        const data = await parseResponseSafe(response);
        if (!response.ok) {
            throw new Error(getApiErrorMessage(response, data));
        }

        saveSessionFromAuth(data);

        const role = data.role ?? data.Role ?? "Customer";
        const targetPage = role === "Admin" || role === "Staff" ? "dashboard.html" : "home.html";
        redirectAfterLogin(targetPage);
    } catch (error) {
        alert("Dang nhap that bai: " + (error.message || "Khong xac dinh"));
        setButtonLoading(loginButton, false);
    }
}

document.getElementById("toRegisterLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMode("register");
});

document.getElementById("toLoginLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMode("login");
});

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
