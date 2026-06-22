const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5088/api";
export const PROFILE_CACHE_KEY = "profile_snapshot";
export const PROFILE_DETAILS_CACHE_KEY = "profile_details_snapshot";
export const MY_LESSONS_CACHE_PREFIX = "my_lessons_snapshot";
export const MY_PAYMENTS_CACHE_PREFIX = "my_payments_snapshot";
export const PROFILE_UPDATED_EVENT = "profile-snapshot-updated";
export const AUTH_STORAGE_KEYS = [
    "token",
    "userId",
    "userRole",
    "user_role",
    "user_name",
    "user_email",
    PROFILE_CACHE_KEY,
    PROFILE_DETAILS_CACHE_KEY
];

export function clearAuthSession() {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (
            key?.startsWith(`${PROFILE_DETAILS_CACHE_KEY}:`) ||
            key?.startsWith(`${MY_LESSONS_CACHE_PREFIX}:`) ||
            key?.startsWith(`${MY_PAYMENTS_CACHE_PREFIX}:`)
        ) {
            localStorage.removeItem(key);
        }
    }
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function hasLocalSession() {
    const token = localStorage.getItem("token")?.trim();
    const userId = localStorage.getItem("userId")?.trim();
    return Boolean(token && userId);
}

function buildAvatarUrl(fullName: string) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || "User")}`;
}

function getAuthHeaders() {
    const token = (localStorage.getItem("token") || "").trim();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function readJsonResponse(response: Response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        const message = data.detail || data.message || data.title || "Request failed.";
        const error = new Error(message);
        (error as any).status = response.status;
        (error as any).details = data;
        throw error;
    }

    return data;
}

async function fetchCurrentProfile() {
    const response = await fetch(`${API_BASE}/profile/me`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return await readJsonResponse(response);
}

export function writeProfileSnapshot(data: any) {
    const fullName = data.fullName || localStorage.getItem("user_name") || "User";
    const snapshot = {
        userId: String(data.id || data.userId || localStorage.getItem("userId") || ""),
        fullName,
        email: data.email || localStorage.getItem("user_email") || "",
        mangaTokens: data.remainingMangaCount ?? null,
        mangaLimit: data.mangaMonthlyLimit ?? null,
        videoTokens: data.remainingVideoCount ?? null,
        videoLimit: data.videoMonthlyLimit ?? null,
        tier: data.planName || data.tier || "Free",
        avatarUrl: data.avatarUrl || buildAvatarUrl(fullName)
    };

    if (data.role) {
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("user_role", data.role);
    }

    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
    return snapshot;
}

export async function refreshProfileSnapshot() {
    const data = await fetchCurrentProfile();
    return writeProfileSnapshot(data);
}

export interface DraftRequest {
    rawContent: string;
    title: string;
    generateVideo: boolean;
    creativeMode: number;
    creativeBrief: string | null;
}

export const api = {
    warmup() {
        return fetch(`${API_BASE}/health/warmup`, {
            method: "GET"
        }).catch(() => undefined);
    },

    async login(email: string, password: string) {
        const response = await fetch(`${API_BASE}/auth/login-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        const data = await readJsonResponse(response);
        const previousUserId = localStorage.getItem("userId");
        if (data.accessToken) {
            localStorage.setItem("token", data.accessToken);
        }
        if (data.userId) localStorage.setItem("userId", data.userId);
        if (previousUserId && data.userId && previousUserId !== data.userId) {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
        if (data.role) {
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("user_role", data.role);
        }
        if (data.fullName) localStorage.setItem("user_name", data.fullName);
        if (data.email) localStorage.setItem("user_email", data.email);
        return data;
    },

    async googleSignIn(accessToken: string) {
        const response = await fetch(`${API_BASE}/auth/google-signin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ accessToken })
        });
        const data = await readJsonResponse(response);
        const previousUserId = localStorage.getItem("userId");
        if (data.accessToken) {
            localStorage.setItem("token", data.accessToken);
        }
        if (data.userId) localStorage.setItem("userId", data.userId);
        if (previousUserId && data.userId && previousUserId !== data.userId) {
            localStorage.removeItem(PROFILE_CACHE_KEY);
        }
        if (data.role) {
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("user_role", data.role);
        }
        if (data.fullName) localStorage.setItem("user_name", data.fullName);
        if (data.email) localStorage.setItem("user_email", data.email);
        return data;
    },

    async register(email: string, password: string, fullName: string, supabaseUserId: string) {
        const response = await fetch(`${API_BASE}/auth/register-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                fullName,
                supabaseUserId,
                role: "Customer"
            })
        });
        return await readJsonResponse(response);
    },

    async verifyOtp(email: string, otpCode: string, fullName: string, supabaseUserId: string) {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                otpCode,
                fullName,
                supabaseUserId
            })
        });
        return await readJsonResponse(response);
    },

    async forgotPassword(email: string) {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });
        return await readJsonResponse(response);
    },

    async verifyResetOtp(email: string, otpCode: string) {
        const response = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, otpCode })
        });
        return await readJsonResponse(response);
    },

    async resetPassword(email: string, otpCode: string, newPassword: string) {
        const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, otpCode, newPassword })
        });
        return await readJsonResponse(response);
    },

    async generateDraft(request: DraftRequest) {
        const response = await fetch(`${API_BASE}/lessons/drafts`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request)
        });
        return await readJsonResponse(response);
    },

    async approveDraft(lessonId: string, overallScript: string) {
        const response = await fetch(`${API_BASE}/lessons/${lessonId}/approve`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ overallScript })
        });
        const data = await readJsonResponse(response);
        await refreshProfileSnapshot();
        return data;
    },

    async getLesson(lessonId: string) {
        const response = await fetch(`${API_BASE}/lessons/${lessonId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async getMyLessons() {
        const response = await fetch(`${API_BASE}/lessons/my`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async getMyPaymentHistory() {
        const response = await fetch(`${API_BASE}/payment/my-history`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async getCurrentProfile() {
        return await fetchCurrentProfile();
    },

    async refreshProfileCache() {
        return await refreshProfileSnapshot();
    },

    async getProfile(userId: string) {
        const response = await fetch(`${API_BASE}/profile/${userId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminGetCustomers() {
        const response = await fetch(`${API_BASE}/admin/customers`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminGetStaffs() {
        const response = await fetch(`${API_BASE}/admin/staffs`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminCreateStaff(body: any) {
        const response = await fetch(`${API_BASE}/admin/staffs`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        return await readJsonResponse(response);
    },

    async adminDeleteStaff(id: string) {
        const response = await fetch(`${API_BASE}/admin/staffs/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminToggleBlockStaff(id: string) {
        const response = await fetch(`${API_BASE}/admin/staffs/${id}/toggle-block`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminDeleteCustomer(id: string) {
        const response = await fetch(`${API_BASE}/admin/customers/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminToggleBlockCustomer(id: string) {
        const response = await fetch(`${API_BASE}/admin/customers/${id}/toggle-block`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminGetTokenSummary() {
        const response = await fetch(`${API_BASE}/admin/tokens/summary`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminGetTokenUsers() {
        const response = await fetch(`${API_BASE}/admin/tokens/users`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminUpdateUserToken(id: string, mangaDelta: number, videoDelta: number, planName: string) {
        const response = await fetch(`${API_BASE}/admin/tokens/users/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ mangaDelta, videoDelta, planName })
        });
        return await readJsonResponse(response);
    },

    async adminGetPaymentHistory() {
        const response = await fetch(`${API_BASE}/admin/payment-history`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async adminGetPaymentStats(groupBy: string = "month") {
        const response = await fetch(`${API_BASE}/admin/payment-stats?groupBy=${groupBy}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async cskhGetHistory() {
        const response = await fetch(`${API_BASE}/admin/cskh/history`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async cskhSendEmail(body: any) {
        const response = await fetch(`${API_BASE}/admin/cskh/send`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        return await readJsonResponse(response);
    },

    async supportCreate(customerEmail: string, content: string) {
        const response = await fetch(`${API_BASE}/support/create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ customerEmail, content })
        });
        return await readJsonResponse(response);
    },

    async supportGetList() {
        const response = await fetch(`${API_BASE}/support/list`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async supportReply(id: string | number, reply: string) {
        const response = await fetch(`${API_BASE}/support/reply`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: String(id), reply })
        });
        return await readJsonResponse(response);
    },

    async feedbackGetList() {
        const response = await fetch(`${API_BASE}/feedback/list`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async reportCreate(content: string) {
        const response = await fetch(`${API_BASE}/report/create`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return await readJsonResponse(response);
    },

    async reportGetList() {
        const response = await fetch(`${API_BASE}/report/list`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return await readJsonResponse(response);
    },

    async reportReply(id: string | number, adminReply: string) {
        const response = await fetch(`${API_BASE}/report/reply`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: String(id), adminReply })
        });
        return await readJsonResponse(response);
    }
};
